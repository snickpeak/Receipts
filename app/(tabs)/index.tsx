import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PinchZoomImageModal } from "@/components/PinchZoomImageModal";
import { PressableScale } from "@/components/PressableScale";
import { RadialFabMenu } from "@/components/RadialFabMenu";
import { ReorderPinsModal } from "@/components/ReorderPinsModal";
import { DailyPromptCard } from "@/components/DailyPromptCard";
import { HeroSection } from "@/components/HeroSection";
import { AnimatedListItem, FadeInView } from "@/components/animations";
import { AnimatedIconBounce } from "@/components/animations/AnimatedIconBounce";
import { useEntries, type Entry, type Tag } from "@/context/EntriesContext";
import { usePhotoHero } from "@/context/PhotoHeroContext";
import { useLock } from "@/context/LockContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { getRestApiBase } from "@/lib/env";
import { mergeTags, getTagColor } from "@/lib/tagsLib";
import { loadPinnedStripOrder, savePinnedStripOrder, sortPinnedEntries } from "@/lib/pinnedStripOrder";
import { computeStreak, loadBestStreak, persistBestStreak, STREAK_MILESTONES } from "@/lib/streakLib";

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

function getWeekLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  if (date >= startOfThisWeek) return "__thisWeek__";
  if (date >= startOfLastWeek) return "__lastWeek__";
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  return year === new Date().getFullYear() ? month : `${month} ${year}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "__today__";
  if (date.toDateString() === yesterday.toDateString()) return "__yesterday__";
  return date.toLocaleDateString("default", { month: "short", day: "numeric" });
}

function formatHeaderDate() {
  return new Date().toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" });
}

function TagStatPill({ tag, count, isActive, onPress, tagColor }: { tag: Tag; count: number; isActive: boolean; onPress: () => void; tagColor: string }) {
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handlePress = () => {
    if (!reducedMotion) {
      scale.value = withSequence(withTiming(0.88, { duration: 80 }), withSpring(1, { damping: 12, stiffness: 200 }));
    }
    onPress();
  };
  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${tag}, ${count} ${count === 1 ? "entry" : "entries"}${isActive ? ", active filter" : ""}`}
        accessibilityHint={isActive ? "Tap to clear filter" : "Tap to filter by this tag"}
        accessibilityState={{ selected: isActive }}
        style={[
          pillStyles.pill,
          {
            backgroundColor: isActive ? tagColor + "22" : colors.muted,
            borderColor: isActive ? tagColor : (count > 0 ? tagColor + "40" : colors.border),
            borderWidth: isActive ? 1.5 : (count > 0 ? 1 : StyleSheet.hairlineWidth),
          },
        ]}
      >
        <View style={[pillStyles.dot, { backgroundColor: count > 0 ? tagColor : colors.mutedForeground }]} accessible={false} />
        <Text style={[pillStyles.tag, { color: count > 0 ? colors.foreground : colors.mutedForeground }]}>{tag}</Text>
        <Text style={[pillStyles.count, { color: count > 0 ? tagColor : colors.mutedForeground }]}>{count}</Text>
        {isActive && <Feather name="x" size={11} color={tagColor} style={{ marginLeft: 1 }} accessible={false} />}
      </Pressable>
    </Animated.View>
  );
}
const pillStyles = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, marginRight: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  tag: { fontSize: 13, fontFamily: "Inter_500Medium" },
  count: { fontSize: 13, fontFamily: "Inter_700Bold" },
});

function EntryCardInner({
  entry,
  onStar,
  tagColor,
  onPhotoPress,
  photoMeasureRef,
}: {
  entry: Entry;
  onStar: () => void;
  tagColor: string;
  onPhotoPress?: (uri: string) => void;
  photoMeasureRef?: React.RefObject<View | null>;
}) {
  const colors = useColors();
  const t = useTranslation();
  const isLocked = entry.locked === true;
  const dateLabelMap: Record<string, string> = {
    __today__: t.common.today,
    __yesterday__: t.common.yesterday,
  };
  return (
    <LinearGradient
      colors={[tagColor + "18", tagColor + "04", "transparent"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1.2 }}
      style={[cardStyles.gradient, { borderColor: tagColor + "28" }]}
    >
      <View style={cardStyles.inner}>
        <View style={cardStyles.topRow}>
          <View style={cardStyles.tagRow}>
            <View style={[cardStyles.tagDot, { backgroundColor: tagColor }]} />
            <Text style={[cardStyles.tagLabel, { color: tagColor }]}>{entry.tag.toUpperCase()}</Text>
            {entry.starred && <Feather name="star" size={10} color="#f59e0b" />}
            {isLocked && <Feather name="lock" size={10} color={colors.mutedForeground} />}
          </View>
          <View style={cardStyles.rightRow}>
            <Text style={[cardStyles.dateLabel, { color: colors.mutedForeground }]}>{dateLabelMap[formatDate(entry.createdAt)] ?? formatDate(entry.createdAt)}</Text>
            <AnimatedIconBounce onPress={onStar}>
              <Feather name="star" size={14} color={entry.starred ? "#f59e0b" : colors.mutedForeground} />
            </AnimatedIconBounce>
          </View>
        </View>
        <Text style={[cardStyles.title, { color: colors.foreground }]} numberOfLines={2}>
          {isLocked ? "🔒 Locked entry" : entry.title}
        </Text>
        {!isLocked && (entry.note || entry.aiSummary) && (
          <Text style={[cardStyles.summary, { color: colors.mutedForeground }]} numberOfLines={2}>
            {entry.note ?? entry.aiSummary}
          </Text>
        )}
        {!isLocked && entry.photoUri && (
          <View ref={photoMeasureRef} collapsable={photoMeasureRef ? false : undefined}>
            {onPhotoPress ? (
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onPhotoPress(entry.photoUri!);
                }}
                accessibilityRole="imagebutton"
                accessibilityLabel="View photo full screen"
              >
                <Image source={{ uri: entry.photoUri }} style={cardStyles.thumb} contentFit="cover" />
              </Pressable>
            ) : (
              <Image source={{ uri: entry.photoUri }} style={cardStyles.thumb} contentFit="cover" />
            )}
          </View>
        )}
      </View>
    </LinearGradient>
  );
}
const cardStyles = StyleSheet.create({
  gradient: { borderRadius: 18, borderWidth: 1 },
  inner: { padding: 18, gap: 8 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rightRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tagDot: { width: 7, height: 7, borderRadius: 3.5 },
  tagLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.4 },
  dateLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  title: { fontSize: 16, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3, lineHeight: 22 },
  summary: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  thumb: { width: "100%", height: 140, borderRadius: 10, marginTop: 4 },
});

function DeleteAction({ progress, onDelete }: { progress: SharedValue<number>; onDelete: () => void }) {
  const style = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ scale: 0.85 + progress.value * 0.15 }] }));
  return (
    <Animated.View style={[deleteStyles.wrapper, style]}>
      <Pressable style={deleteStyles.button} onPress={onDelete}>
        <Feather name="trash-2" size={20} color="#fff" />
        <Text style={deleteStyles.label}>Delete</Text>
      </Pressable>
    </Animated.View>
  );
}
const deleteStyles = StyleSheet.create({
  wrapper: { width: 80, marginLeft: 8, marginBottom: 10, borderRadius: 18, overflow: "hidden", backgroundColor: "#ef4444" },
  button: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  label: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
});

function SwipeableEntryCard({
  entry,
  onDelete,
  onStar,
  tagColor,
  onPhotoPress,
}: {
  entry: Entry;
  onDelete: (id: string) => void;
  onStar: (id: string) => void;
  tagColor: string;
  onPhotoPress?: (uri: string) => void;
}) {
  const { preparePhotoHero } = usePhotoHero();
  const thumbMeasureRef = useRef<View | null>(null);
  const swipeableRef = useRef<Swipeable>(null);
  const progress = useSharedValue(0);
  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    swipeableRef.current?.close();
    setTimeout(() => onDelete(entry.id), 150);
  };
  return (
    <View style={swipeStyles.container}>
      <Swipeable
        ref={swipeableRef}
        friction={1.8}
        overshootRight={false}
        rightThreshold={40}
        onSwipeableWillOpen={() => { progress.value = withSpring(1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        onSwipeableWillClose={() => { progress.value = withSpring(0); }}
        renderRightActions={() => <DeleteAction progress={progress} onDelete={handleDelete} />}
      >
        <PressableScale
          spring
          haptic="light"
          onPress={() => {
            const navigate = () => router.push(`/entry/${entry.id}`);
            if (Platform.OS === "web" || !entry.photoUri || thumbMeasureRef.current == null) {
              navigate();
              return;
            }
            thumbMeasureRef.current.measureInWindow((x, y, width, height) => {
              if (width < 2 || height < 2) {
                navigate();
                return;
              }
              preparePhotoHero({
                entryId: entry.id,
                uri: entry.photoUri!,
                x,
                y,
                width,
                height,
              });
              navigate();
            });
          }}
          style={{ borderRadius: 18 }}
        >
          <EntryCardInner
            entry={entry}
            tagColor={tagColor}
            photoMeasureRef={thumbMeasureRef}
            onPhotoPress={onPhotoPress}
            onStar={() => {
              onStar(entry.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
        </PressableScale>
      </Swipeable>
    </View>
  );
}
const swipeStyles = StyleSheet.create({ container: { marginHorizontal: 16, marginBottom: 10 } });

interface Section { title: string; data: Entry[] }

export default function TimelineScreen() {
  const colors = useColors();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { entries, deleteEntry, toggleStar, tamperDetected, online, pendingSyncCount } = useEntries();
  const [bestStreak, setBestStreak] = useState(0);
  const [milestoneShown, setMilestoneShown] = useState<Set<number>>(new Set());
  useEffect(() => { void loadBestStreak().then(setBestStreak); }, []);
  useEffect(() => { void loadPinnedStripOrder().then(setPinnedOrder); }, []);
  const { settings } = useSettings();
  const { decoyMode } = useLock();
  const allTags = useMemo(() => mergeTags(settings.customTags), [settings.customTags]);
  const TAG_ORDER: Tag[] = useMemo(() => allTags.map((t) => t.label), [allTags]);
  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  const [activeTag, setActiveTag] = useState<Tag | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [reorderPinsOpen, setReorderPinsOpen] = useState(false);
  const [pinnedOrder, setPinnedOrder] = useState<string[]>([]);
  const [timelinePinchUri, setTimelinePinchUri] = useState<string | null>(null);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });
  const headerParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, 140], [0, -32], Extrapolation.CLAMP) },
    ],
  }));
  const titleShrinkStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scrollY.value, [0, 100], [1, 0.9], Extrapolation.CLAMP) },
    ],
  }));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  const handlePinnedReorder = useCallback(async (ids: string[]) => {
    setPinnedOrder(ids);
    await savePinnedStripOrder(ids);
  }, []);

  const visibleEntries = decoyMode ? [] : entries;

  // ── #1 Streak — derive from active entries; persist best in AsyncStorage ──
  const streak = useMemo(
    () => computeStreak(visibleEntries.map((e) => e.createdAt), bestStreak),
    [visibleEntries, bestStreak],
  );
  useEffect(() => {
    if (streak.best > bestStreak) {
      setBestStreak(streak.best);
      void persistBestStreak(streak.best);
    }
    if (STREAK_MILESTONES.includes(streak.current) && !milestoneShown.has(streak.current)) {
      setMilestoneShown((s) => new Set(s).add(streak.current));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [streak.current, streak.best, bestStreak, milestoneShown]);

  // ── #6 Pinned strip ──────────────────────────────────────────────────────
  const pinnedEntries = useMemo(() => {
    const pin = visibleEntries.filter((e) => e.pinned).slice(0, 5);
    return sortPinnedEntries(pin, pinnedOrder);
  }, [visibleEntries, pinnedOrder]);

  const tagCounts = useMemo<Record<Tag, number>>(
    () => TAG_ORDER.reduce((acc, tag) => ({ ...acc, [tag]: visibleEntries.filter((e) => e.tag === tag).length }), {} as Record<Tag, number>),
    [visibleEntries, TAG_ORDER]
  );

  // ── #19 On-this-day — entries from prior years on same MM-DD ───────────────
  const onThisDay = useMemo(() => {
    const now = new Date();
    return visibleEntries.filter((e) => {
      const d = new Date(e.createdAt);
      if (d.getFullYear() === now.getFullYear()) return false;
      return d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    });
  }, [visibleEntries]);

  const filteredEntries = useMemo(
    () => activeTag ? visibleEntries.filter((e) => e.tag === activeTag) : visibleEntries,
    [visibleEntries, activeTag]
  );

  const sections = useMemo<Section[]>(() => {
    const grouped: Record<string, Entry[]> = {};
    for (const entry of filteredEntries) {
      const label = getWeekLabel(entry.createdAt);
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(entry);
    }
    return Object.entries(grouped).map(([title, data]) => ({ title, data }));
  }, [filteredEntries]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, { paddingTop: topInset + 12, borderBottomColor: colors.border }, headerParallaxStyle]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.brandLabel, { color: colors.mutedForeground }]}>RECEIPTS</Text>
            <Animated.View style={titleShrinkStyle}>
              <Text style={[styles.dateHeading, { color: colors.foreground }]}>{formatHeaderDate()}</Text>
            </Animated.View>
          </View>
          <View style={styles.headerActions}>
            {streak.current > 0 && (
              <Pressable
                onPress={() => router.push("/digest" as any)}
                style={[styles.streakChip, { backgroundColor: "#f59e0b18", borderColor: "#f59e0b40" }]}
                accessibilityRole="button"
                accessibilityLabel={`${streak.current}-day streak`}
                accessibilityHint="Tap to view your streak digest"
              >
                <Text style={styles.streakEmoji} accessible={false}>🔥</Text>
                <Text style={[styles.streakText, { color: "#f59e0b" }]} accessible={false}>{streak.current}</Text>
              </Pressable>
            )}
            {(!online || (pendingSyncCount > 0 && !!getRestApiBase())) && (
              <View style={[styles.offlineChip, { backgroundColor: !online ? "#f59e0b22" : "#3b82f622", borderColor: !online ? "#f59e0b66" : "#3b82f666" }]}>
                <Feather name={!online ? "cloud-off" : "upload-cloud"} size={11} color={!online ? "#f59e0b" : "#3b82f6"} />
                <Text style={[styles.offlineChipText, { color: !online ? "#f59e0b" : "#3b82f6" }]}>
                  {!online ? "Offline" : `${pendingSyncCount} queued`}
                </Text>
              </View>
            )}
            <Pressable
              style={[styles.iconBtn, { backgroundColor: colors.muted }]}
              onPress={() => router.push("/settings")}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              hitSlop={8}
            >
              <Feather name="settings" size={16} color={colors.mutedForeground} accessible={false} />
            </Pressable>
            <PressableScale
              spring
              haptic="light"
              style={[styles.addButton, { backgroundColor: colors.foreground }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/add");
              }}
              onLongPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setFabMenuOpen(true);
              }}
              delayLongPress={420}
              accessibilityRole="button"
              accessibilityLabel="Add new entry"
              accessibilityHint="Long press for quick add options"
            >
              <Feather name="plus" size={18} color={colors.background} accessible={false} />
            </PressableScale>
          </View>
        </View>
        <View style={styles.statsRow}>
          {TAG_ORDER.map((tag) => (
            <TagStatPill
              key={tag}
              tag={tag}
              count={tagCounts[tag]}
              isActive={activeTag === tag}
              tagColor={getTagColor(tag, settings.customTags)}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTag((prev) => (prev === tag ? null : tag));
              }}
            />
          ))}
        </View>
      </Animated.View>

      {visibleEntries.length === 0 ? (
        <View style={{ flex: 1 }}>
          <DailyPromptCard />
          <FadeInView from="bottom" distance={25} delay={100} spring style={[styles.emptyState, { paddingBottom: bottomInset }]}>
            <LinearGradient colors={["#a855f715", "transparent"]} style={styles.emptyIconWrap}>
              <Feather name="layers" size={32} color="#a855f7" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t.timeline.emptyTitle}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>{t.timeline.emptySubtitle}</Text>
          </FadeInView>
        </View>
      ) : (
        <AnimatedSectionList
          sections={sections}
          keyExtractor={(item) => String((item as Entry).id)}
          contentContainerStyle={{ paddingBottom: bottomInset, paddingTop: 6 }}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />}
          ListHeaderComponent={
            <View>
              {tamperDetected && (
                <View style={styles.tamperBanner}>
                  <Feather name="alert-triangle" size={13} color="#ef4444" />
                  <Text style={styles.tamperText}>Tamper detected — entries modified outside the app</Text>
                </View>
              )}
              {!activeTag && onThisDay.length > 0 && (
                <FadeInView from="left" distance={20} delay={150} spring>
                <Pressable
                  style={[styles.onThisDayCard, { backgroundColor: "#a855f714", borderColor: "#a855f740" }]}
                  onPress={() => router.push(`/entry/${onThisDay[0].id}`)}
                >
                  <View style={styles.onThisDayHeader}>
                    <Feather name="clock" size={13} color="#a855f7" />
                    <Text style={styles.onThisDayLabel}>ON THIS DAY</Text>
                  </View>
                  <Text style={[styles.onThisDayTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {onThisDay[0].locked ? "🔒 Locked entry" : onThisDay[0].title}
                  </Text>
                  <Text style={[styles.onThisDayMeta, { color: colors.mutedForeground }]}>
                    {new Date(onThisDay[0].createdAt).getFullYear()}
                    {onThisDay.length > 1 ? ` · +${onThisDay.length - 1} more` : ""}
                  </Text>
                </Pressable>
                </FadeInView>
              )}
              {!activeTag && pinnedEntries.length > 0 && (
                <View style={styles.pinnedSection}>
                  <Pressable
                    onLongPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setReorderPinsOpen(true);
                    }}
                    delayLongPress={460}
                  >
                    <Text style={[styles.pinnedHeader, { color: colors.mutedForeground }]}>📌 PINNED · hold to reorder</Text>
                  </Pressable>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pinnedRow}>
                    {pinnedEntries.map((p) => {
                      const tc = getTagColor(p.tag, settings.customTags);
                      return (
                        <Pressable
                          key={p.id}
                          onPress={() => router.push(`/entry/${p.id}` as any)}
                          style={[styles.pinnedCard, { backgroundColor: tc + "14", borderColor: tc + "40" }]}
                        >
                          <View style={[styles.pinnedDot, { backgroundColor: tc }]} />
                          <Text numberOfLines={2} style={[styles.pinnedTitle, { color: colors.foreground }]}>
                            {p.locked ? "🔒 Locked" : p.title}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
              {!activeTag && <HeroSection />}
            </View>
          }
          ListEmptyComponent={
            activeTag ? (
              <View style={styles.filterEmpty}>
                <Text style={[styles.filterEmptyText, { color: colors.mutedForeground }]}>
                  {t.timeline.noTagEntries.replace("{{tag}}", activeTag ?? "")}
                </Text>
              </View>
            ) : null
          }
          renderSectionHeader={({ section }) => {
            const sec = section as Section;
            const weekLabelMap: Record<string, string> = {
              __thisWeek__: t.common.thisWeek,
              __lastWeek__: t.common.lastWeek,
              __today__: t.common.today,
              __yesterday__: t.common.yesterday,
            };
            const label = weekLabelMap[sec.title] ?? sec.title;
            return <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>;
          }}
          renderItem={({ item, index }) => {
            const entry = item as Entry;
            return (
            <AnimatedListItem index={index} staggerMs={40}>
              <SwipeableEntryCard
                entry={entry}
                onDelete={deleteEntry}
                onStar={toggleStar}
                tagColor={getTagColor(entry.tag, settings.customTags)}
                onPhotoPress={setTimelinePinchUri}
              />
            </AnimatedListItem>
            );
          }}
        />
      )}
      <RadialFabMenu open={fabMenuOpen} onClose={() => setFabMenuOpen(false)} topOffset={topInset + 40} />
      <ReorderPinsModal
        visible={reorderPinsOpen}
        pinned={pinnedEntries}
        onClose={() => setReorderPinsOpen(false)}
        onReorder={handlePinnedReorder}
      />
      <PinchZoomImageModal
        uri={timelinePinchUri}
        visible={!!timelinePinchUri}
        onClose={() => setTimelinePinchUri(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 14 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  brandLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2.5, marginBottom: 4 },
  dateHeading: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  offlineChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  offlineChipText: { fontSize: 11, fontWeight: "600" },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  sectionHeader: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 10 },
  filterEmpty: { alignItems: "center", justifyContent: "center", paddingTop: 60 },
  filterEmptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  tamperBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, backgroundColor: "#ef444414", borderColor: "#ef444440" },
  tamperText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#ef4444", flex: 1 },
  streakChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  streakEmoji: { fontSize: 12 },
  streakText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  pinnedSection: { paddingTop: 12 },
  pinnedHeader: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5, paddingHorizontal: 20, paddingBottom: 8 },
  pinnedRow: { paddingHorizontal: 16, gap: 10 },
  pinnedCard: { width: 160, padding: 12, borderRadius: 12, borderWidth: 1, gap: 6 },
  pinnedDot: { width: 6, height: 6, borderRadius: 3 },
  pinnedTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  onThisDayCard: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  onThisDayHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  onThisDayLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.4, color: "#a855f7" },
  onThisDayTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", lineHeight: 21 },
  onThisDayMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
