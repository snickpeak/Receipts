import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEntries, type Entry } from "@/context/EntriesContext";
import { FadeInView } from "@/components/animations";
import { useColors } from "@/hooks/useColors";
import { useLocaleFont } from "@/hooks/useLocaleFont";

// ── Constants ──────────────────────────────────────────────────────────────────
const TAG_COLORS: Record<string, string> = {
  Money: "#22c55e",
  Promise: "#3b82f6",
  Memory: "#a855f7",
  Win: "#f59e0b",
  Proof: "#ef4444",
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ── Helpers ────────────────────────────────────────────────────────────────────
/** Local calendar day key YYYY-MM-DD (not UTC) so entries match the user's date & time. */
function localDateKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function localDateKeyFromCreatedAt(iso: string): string {
  return localDateKeyFromDate(new Date(iso));
}

function getMonthCells(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  }
  while (cells.length < 42) cells.push(null);
  return cells;
}

// ── MiniMonth (year view) ──────────────────────────────────────────────────────
function MiniMonth({
  year,
  month,
  entryDateMap,
  cellSize,
  onPress,
  colors,
}: {
  year: number;
  month: number;
  entryDateMap: Record<string, Entry[]>;
  cellSize: number;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const cells = useMemo(() => getMonthCells(year, month), [year, month]);
  const hasAny = cells.some((d) => d && (entryDateMap[d]?.length ?? 0) > 0);

  const rows: (string | null)[][] = [];
  for (let r = 0; r < 6; r++) rows.push(cells.slice(r * 7, r * 7 + 7));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        miniStyles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <Text
        style={[
          miniStyles.monthName,
          { color: hasAny ? colors.foreground : colors.mutedForeground },
        ]}
      >
        {MONTH_SHORT[month]}
      </Text>
      {rows.map((row, ri) => (
        <View key={ri} style={miniStyles.miniRow}>
          {row.map((dateStr, ci) => {
            const dayEntries = dateStr ? (entryDateMap[dateStr] ?? []) : [];
            const dotColor =
              dayEntries.length > 0
                ? (TAG_COLORS[dayEntries[0].tag] ?? "#a855f7") + "bb"
                : "transparent";
            return (
              <View
                key={ci}
                style={[
                  miniStyles.miniCell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: dotColor,
                    borderRadius: cellSize,
                  },
                ]}
              />
            );
          })}
        </View>
      ))}
    </Pressable>
  );
}

const miniStyles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
    gap: 2,
    flex: 1,
  },
  monthName: { fontSize: 11, fontFamily: "Inter_700Bold", marginBottom: 3, letterSpacing: 0.3 },
  miniRow: { flexDirection: "row", gap: 1, marginBottom: 1 },
  miniCell: {},
});

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const colors = useColors();
  const font = useLocaleFont();
  const insets = useSafeAreaInsets();
  const { entries } = useEntries();

  const today = new Date();
  const todayStr = localDateKeyFromDate(today);

  const [viewMode, setViewMode] = useState<"day" | "month" | "year">("month");
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const screenWidth = Dimensions.get("window").width;
  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  // Track viewMode for gesture closure (avoids stale ref)
  const viewModeRef = useRef<"day" | "month" | "year">("month");
  viewModeRef.current = viewMode;

  // Entry date map: local YYYY-MM-DD → entries that day (newest last; excludes trash)
  const entryDateMap = useMemo(() => {
    const map: Record<string, Entry[]> = {};
    for (const entry of entries) {
      if (entry.trashedAt) continue;
      const key = localDateKeyFromCreatedAt(entry.createdAt);
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return map;
  }, [entries]);

  // Fade animation between month ↔ year
  const fadeVal = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ opacity: fadeVal.value }));

  const switchView = useCallback(
    (to: "day" | "month" | "year") => {
      fadeVal.value = withTiming(0, { duration: 110 });
      setTimeout(() => {
        setViewMode(to);
        fadeVal.value = withTiming(1, { duration: 200 });
      }, 120);
    },
    [fadeVal]
  );

  // Pinch gesture — pinch in (scale < 0.75) → year; pinch out (scale > 1.25) → month
  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onEnd((e) => {
          const mode = viewModeRef.current;
          if (e.scale < 0.75) {
            // Pinch in → zoom out
            if (mode === "day") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); switchView("month"); }
            else if (mode === "month") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); switchView("year"); }
          } else if (e.scale > 1.25) {
            // Pinch out → zoom in
            if (mode === "year") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); switchView("month"); }
            else if (mode === "month") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); switchView("day"); }
          }
        }),
    [switchView]
  );

  // Month navigation
  const prevMonth = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth((m) => {
      if (m === 0) { setCurrentYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth((m) => {
      if (m === 11) { setCurrentYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  // Day tap — one entry that day: open that post; several: day list; none: empty day view
  const handleDayPress = useCallback(
    (dateStr: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const list = entryDateMap[dateStr] ?? [];
      if (list.length === 1) {
        router.push(`/entry/${list[0].id}`);
        return;
      }
      setSelectedDateStr(dateStr);
      switchView("day");
    },
    [entryDateMap, switchView]
  );

  // Day view navigation
  const shiftSelectedDay = useCallback((delta: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDateStr((prev) => {
      const d = new Date(prev + "T12:00:00");
      d.setDate(d.getDate() + delta);
      return localDateKeyFromDate(d);
    });
  }, []);

  // Month grid
  const monthCells = useMemo(
    () => getMonthCells(currentYear, currentMonth),
    [currentYear, currentMonth]
  );
  const cellSize = Math.floor((screenWidth - 32) / 7);
  const monthRows: (string | null)[][] = [];
  for (let r = 0; r < 6; r++) monthRows.push(monthCells.slice(r * 7, r * 7 + 7));

  // Year view mini-month sizing
  const miniMonthGap = 8;
  const miniMonthWidth = Math.floor((screenWidth - 32 - miniMonthGap * 2) / 3);
  const miniCellSize = Math.max(3, Math.floor((miniMonthWidth - 16 - 6) / 7));

  // Count of days in this month that have entries (for header)
  const activeDaysCount = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-`;
    return Object.keys(entryDateMap).filter((k) => k.startsWith(prefix)).length;
  }, [entryDateMap, currentYear, currentMonth]);

  return (
    <GestureDetector gesture={pinchGesture}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>

        {/* Header */}
        <View style={[styles.headerWrap, { paddingTop: topInset + 12 }]}>
          <LinearGradient
            colors={["#a855f720", "transparent"]}
            style={styles.headerIcon}
          >
            <Feather name="calendar" size={20} color="#a855f7" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: font.bold }]}>
              Calendar
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {viewMode === "month"
                ? activeDaysCount > 0
                  ? `${activeDaysCount} days with entries · tap a day to open · pinch to zoom`
                  : "Tap any day to browse · pinch in for year, out for day"
                : viewMode === "year"
                ? "Tap a month or pinch to zoom in"
                : "Pinch in to return to month"}
            </Text>
          </View>

          {viewMode === "month" && (
            <Pressable
              onPress={() => {
                setCurrentYear(today.getFullYear());
                setCurrentMonth(today.getMonth());
                setSelectedDateStr(todayStr);
                switchView("day");
              }}
              style={[styles.headerBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <Text style={[styles.headerBtnText, { color: colors.mutedForeground }]}>Today</Text>
            </Pressable>
          )}
          {viewMode === "year" && (
            <Pressable
              onPress={() => switchView("month")}
              style={[styles.headerBtn, { backgroundColor: "#a855f718", borderColor: "#a855f740" }]}
            >
              <Text style={[styles.headerBtnText, { color: "#a855f7" }]}>Month</Text>
            </Pressable>
          )}
          {viewMode === "day" && (
            <Pressable
              onPress={() => switchView("month")}
              style={[styles.headerBtn, { backgroundColor: "#a855f718", borderColor: "#a855f740" }]}
            >
              <Text style={[styles.headerBtnText, { color: "#a855f7" }]}>Month</Text>
            </Pressable>
          )}
        </View>

        <Animated.View style={[{ flex: 1 }, animStyle]}>

          {/* ── MONTH VIEW ─────────────────────────────────────────────────── */}
          {viewMode === "month" && (
            <View style={{ flex: 1 }}>

              {/* Month navigator */}
              <View style={styles.monthNav}>
                <Pressable
                  onPress={prevMonth}
                  hitSlop={14}
                  style={[styles.navBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <Feather name="chevron-left" size={18} color={colors.foreground} />
                </Pressable>

                <Pressable onPress={() => switchView("year")} style={styles.monthTitleWrap}>
                  <Text style={[styles.monthTitle, { color: colors.foreground, fontFamily: font.bold }]}>
                    {MONTH_NAMES[currentMonth]}
                  </Text>
                  <Text style={[styles.yearLabel, { color: colors.mutedForeground }]}>
                    {currentYear}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={nextMonth}
                  hitSlop={14}
                  style={[styles.navBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <Feather name="chevron-right" size={18} color={colors.foreground} />
                </Pressable>
              </View>

              {/* Weekday labels */}
              <View style={[styles.weekdayRow, { paddingHorizontal: 16 }]}>
                {WEEKDAYS.map((d, i) => (
                  <View key={i} style={[styles.weekdayCell, { width: cellSize }]}>
                    <Text style={[styles.weekdayLabel, { color: colors.mutedForeground }]}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Day grid */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomInset + 110 }}
              >
                {monthRows.map((row, ri) => (
                  <View key={ri} style={styles.dayRow}>
                    {row.map((dateStr, ci) => {
                      if (!dateStr) {
                        return (
                          <View
                            key={ci}
                            style={{ width: cellSize, height: cellSize }}
                          />
                        );
                      }

                      const dayEntries = entryDateMap[dateStr] ?? [];
                      const hasEntries = dayEntries.length > 0;
                      const isToday = dateStr === todayStr;
                      const dayNum = parseInt(dateStr.slice(8), 10);
                      const visibleDots = dayEntries.slice(0, 3);
                      const extraCount = dayEntries.length - 3;

                      return (
                        <Pressable
                          key={ci}
                          onPress={() => handleDayPress(dateStr)}
                          style={({ pressed }) => [
                            styles.dayCell,
                            {
                              width: cellSize,
                              height: cellSize,
                              opacity: pressed ? 0.65 : 1,
                            },
                          ]}
                        >
                          {/* Day number circle */}
                          <View
                            style={[
                              styles.dayNumWrap,
                              isToday && { backgroundColor: "#a855f7" },
                              !isToday && hasEntries && {
                                backgroundColor: (TAG_COLORS[dayEntries[0].tag] ?? "#a855f7") + "18",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayNum,
                                {
                                  color: isToday
                                    ? "#fff"
                                    : hasEntries
                                    ? colors.foreground
                                    : colors.mutedForeground,
                                  fontFamily: isToday || hasEntries ? font.bold : font.regular,
                                },
                              ]}
                            >
                              {dayNum}
                            </Text>
                          </View>

                          {/* Entry dots */}
                          {hasEntries && (
                            <View style={styles.dotsRow}>
                              {visibleDots.map((e, di) => (
                                <View
                                  key={di}
                                  style={[
                                    styles.dot,
                                    { backgroundColor: TAG_COLORS[e.tag] ?? "#a855f7" },
                                  ]}
                                />
                              ))}
                              {extraCount > 0 && (
                                <Text style={[styles.extraCount, { color: colors.mutedForeground }]}>
                                  +{extraCount}
                                </Text>
                              )}
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── YEAR VIEW ──────────────────────────────────────────────────── */}
          {viewMode === "year" && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: bottomInset + 110,
                gap: miniMonthGap,
              }}
            >
              {/* Year navigator */}
              <View style={[styles.monthNav, { marginBottom: 4 }]}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentYear((y) => y - 1); }}
                  hitSlop={14}
                  style={[styles.navBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <Feather name="chevron-left" size={18} color={colors.foreground} />
                </Pressable>
                <Text style={[styles.monthTitle, { color: colors.foreground, fontFamily: font.bold, flex: 1, textAlign: "center" }]}>
                  {currentYear}
                </Text>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentYear((y) => y + 1); }}
                  hitSlop={14}
                  style={[styles.navBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <Feather name="chevron-right" size={18} color={colors.foreground} />
                </Pressable>
              </View>

              {/* 4 rows × 3 months */}
              {[0, 1, 2, 3].map((rowIdx) => (
                <FadeInView key={rowIdx} delay={80 + rowIdx * 70} from="bottom" distance={14} spring>
                <View style={[styles.miniMonthRow, { gap: miniMonthGap }]}>
                  {[0, 1, 2].map((colIdx) => {
                    const m = rowIdx * 3 + colIdx;
                    return (
                      <MiniMonth
                        key={m}
                        year={currentYear}
                        month={m}
                        entryDateMap={entryDateMap}
                        cellSize={miniCellSize}
                        colors={colors}
                        onPress={() => {
                          setCurrentMonth(m);
                          switchView("month");
                        }}
                      />
                    );
                  })}
                </View>
                </FadeInView>
              ))}
            </ScrollView>
          )}

          {/* ── DAY VIEW ───────────────────────────────────────────────────── */}
          {viewMode === "day" && (() => {
            const dayDate = new Date(selectedDateStr + "T12:00:00");
            const dayEntries = entryDateMap[selectedDateStr] ?? [];
            const isSelectedToday = selectedDateStr === todayStr;
            const dayLabel = dayDate.toLocaleDateString("default", { weekday: "long" });
            const dateLabel = dayDate.toLocaleDateString("default", { month: "long", day: "numeric", year: "numeric" });

            return (
              <View style={{ flex: 1 }}>
                {/* Day navigator */}
                <View style={styles.monthNav}>
                  <Pressable
                    onPress={() => shiftSelectedDay(-1)}
                    hitSlop={14}
                    style={[styles.navBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  >
                    <Feather name="chevron-left" size={18} color={colors.foreground} />
                  </Pressable>

                  <View style={styles.monthTitleWrap}>
                    <Text style={[styles.monthTitle, { color: colors.foreground, fontFamily: font.bold }]}>
                      {isSelectedToday ? "Today" : dayLabel}
                    </Text>
                    <Text style={[styles.yearLabel, { color: colors.mutedForeground }]}>
                      {dateLabel}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => shiftSelectedDay(1)}
                    hitSlop={14}
                    style={[styles.navBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  >
                    <Feather name="chevron-right" size={18} color={colors.foreground} />
                  </Pressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingBottom: bottomInset + 110,
                    gap: 10,
                  }}
                >
                  {/* Summary chip row */}
                  <View style={[dayStyles.summary, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    <Feather
                      name={dayEntries.length > 0 ? "edit-3" : "moon"}
                      size={14}
                      color={dayEntries.length > 0 ? "#a855f7" : colors.mutedForeground}
                    />
                    <Text style={[dayStyles.summaryText, { color: colors.foreground }]}>
                      {dayEntries.length === 0
                        ? "No entries on this day"
                        : `${dayEntries.length} ${dayEntries.length === 1 ? "entry" : "entries"}`}
                    </Text>
                    {!isSelectedToday && (
                      <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedDateStr(todayStr); }}
                        style={dayStyles.todayChip}
                      >
                        <Text style={dayStyles.todayChipText}>Jump to today</Text>
                      </Pressable>
                    )}
                  </View>

                  {dayEntries.length === 0 ? (
                    <FadeInView delay={100} from="bottom" distance={12} spring>
                    <View style={[dayStyles.emptyCard, { borderColor: colors.border }]}>
                      <Feather name="feather" size={28} color={colors.mutedForeground} />
                      <Text style={[dayStyles.emptyTitle, { color: colors.foreground }]}>Nothing logged</Text>
                      <Text style={[dayStyles.emptySub, { color: colors.mutedForeground }]}>
                        {isSelectedToday
                          ? "Capture a moment, win, or proof from today."
                          : "This day is empty. Use the arrows to browse other days."}
                      </Text>
                      {isSelectedToday && (
                        <Pressable
                          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/add"); }}
                          style={dayStyles.addBtn}
                        >
                          <Feather name="plus" size={14} color="#fff" />
                          <Text style={dayStyles.addBtnText}>Add entry</Text>
                        </Pressable>
                      )}
                    </View>
                    </FadeInView>
                  ) : (
                    dayEntries.map((entry, idx) => {
                      const color = TAG_COLORS[entry.tag] ?? "#a855f7";
                      const t = new Date(entry.createdAt);
                      const timeLabel = t.toLocaleTimeString("default", { hour: "numeric", minute: "2-digit" });
                      return (
                        <FadeInView key={entry.id} delay={80 + idx * 50} from="bottom" distance={10} spring>
                        <Pressable
                          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/entry/${entry.id}`); }}
                          style={({ pressed }) => [
                            dayStyles.entryRow,
                            {
                              backgroundColor: colors.muted,
                              borderColor: color + "35",
                              opacity: pressed ? 0.72 : 1,
                            },
                          ]}
                        >
                          <View style={[dayStyles.tagStripe, { backgroundColor: color }]} />
                          <View style={{ flex: 1, paddingLeft: 8 }}>
                            <View style={dayStyles.entryHead}>
                              <Text style={[dayStyles.entryTitle, { color: colors.foreground }]} numberOfLines={1}>
                                {entry.title}
                              </Text>
                              <Text style={[dayStyles.entryTime, { color: colors.mutedForeground }]}>
                                {timeLabel}
                              </Text>
                            </View>
                            {(entry.note || entry.aiSummary) && (
                              <Text
                                style={[dayStyles.entryNote, { color: colors.mutedForeground }]}
                                numberOfLines={2}
                              >
                                {entry.note ?? entry.aiSummary}
                              </Text>
                            )}
                            <View style={[dayStyles.tagBadge, { backgroundColor: color + "18", borderColor: color + "40" }]}>
                              <Text style={[dayStyles.tagBadgeText, { color }]}>{entry.tag.toUpperCase()}</Text>
                            </View>
                          </View>
                          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                        </Pressable>
                        </FadeInView>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            );
          })()}

        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const dayStyles = StyleSheet.create({
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  summaryText: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  todayChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#a855f720",
  },
  todayChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#a855f7" },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    borderStyle: "dashed",
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 6 },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18, maxWidth: 260 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#a855f7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  addBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
  },
  tagStripe: { width: 3, height: "100%", borderRadius: 2, position: "absolute", left: 0, top: 0, bottom: 0 },
  entryHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  entryTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  entryTime: { fontSize: 11, fontFamily: "Inter_500Medium" },
  entryNote: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 17 },
  tagBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 6,
  },
  tagBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
});

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 22, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  monthTitleWrap: { flex: 1, alignItems: "center" },
  monthTitle: { fontSize: 18 },
  yearLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 1 },
  weekdayRow: { flexDirection: "row", marginBottom: 2 },
  weekdayCell: { alignItems: "center", paddingVertical: 4 },
  weekdayLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  dayRow: { flexDirection: "row" },
  dayCell: { alignItems: "center", justifyContent: "center", gap: 4 },
  dayNumWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: { fontSize: 14 },
  dotsRow: { flexDirection: "row", gap: 2, alignItems: "center", height: 7 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  extraCount: { fontSize: 9, fontFamily: "Inter_500Medium" },
  miniMonthRow: { flexDirection: "row" },
});
