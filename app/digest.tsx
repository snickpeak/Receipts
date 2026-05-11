import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEntries } from "@/context/EntriesContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { getTagColor } from "@/lib/tagsLib";
import { computeStreak } from "@/lib/streakLib";
import { totalWordsAcross } from "@/lib/exportLib";

const HEATMAP_WEEKS = 12;
const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function dayKey(d: Date) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: color ?? colors.foreground }]}>{value}</Text>
      {sub ? <Text style={[styles.statSub, { color: colors.mutedForeground }]}>{sub}</Text> : null}
    </View>
  );
}

export default function DigestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries } = useEntries();
  const { settings } = useSettings();

  const now = new Date();
  const today = startOfDay(now);

  // ── #3 Past 7-day digest ──────────────────────────────────────────────────
  const last7 = useMemo(() => {
    const cutoff = startOfDay(new Date()).getTime() - 6 * DAY;
    return entries.filter((e) => new Date(e.createdAt).getTime() >= cutoff);
  }, [entries]);

  const streak = useMemo(
    () => computeStreak(entries.map((e) => e.createdAt), 0),
    [entries],
  );

  const tagBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of last7) counts.set(e.tag, (counts.get(e.tag) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [last7]);

  const topWords = useMemo(() => {
    const stop = new Set([
      "the","and","for","with","that","this","have","from","you","your","but","not","was","were","are","i","a","an","of","to","in","is","it","on","my","me","be","at","or","as","we","so","if","do","just","had","has","by","up","out","get","got","one","like","can","all","more","some","there","what","when","then","than","about","into","over","really","very","still","also","been","being","day","today",
    ]);
    const counts = new Map<string, number>();
    for (const e of last7) {
      const text = `${e.title} ${e.note ?? ""}`.toLowerCase();
      for (const w of text.split(/[^a-z']+/)) {
        if (w.length < 4 || stop.has(w)) continue;
        counts.set(w, (counts.get(w) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [last7]);

  const starred7 = useMemo(() => last7.filter((e) => e.starred).slice(0, 5), [last7]);

  // ── #4 Calendar heatmap (last 12 weeks) ───────────────────────────────────
  const heatmap = useMemo(() => {
    const totalDays = HEATMAP_WEEKS * 7;
    const startDay = startOfDay(new Date(today.getTime() - (totalDays - 1) * DAY));
    // Align to Sunday at the start.
    while (startDay.getDay() !== 0) startDay.setDate(startDay.getDate() - 1);

    const counts = new Map<string, number>();
    for (const e of entries) {
      const d = startOfDay(new Date(e.createdAt));
      if (d < startDay || d > today) continue;
      counts.set(dayKey(d), (counts.get(dayKey(d)) ?? 0) + 1);
    }

    const cells: { date: Date; count: number; isFuture: boolean }[] = [];
    const cursor = new Date(startDay);
    while (cursor <= new Date(today.getTime() + 6 * DAY)) {
      const isFuture = cursor > today;
      cells.push({ date: new Date(cursor), count: counts.get(dayKey(cursor)) ?? 0, isFuture });
      cursor.setDate(cursor.getDate() + 1);
    }

    const max = cells.reduce((m, c) => Math.max(m, c.count), 0);
    return { cells, max, startDay };
  }, [entries, today]);

  // ── #5 Mood by week (current 7 days) ─────────────────────────────────────
  const moodCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of last7) {
      if (!e.mood) continue;
      counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [last7]);

  const totalWords = useMemo(() => totalWordsAcross(last7), [last7]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="x" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Weekly Digest</Text>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 18 }}>
        {/* Summary stats */}
        <View style={styles.statRow}>
          <StatCard label="ENTRIES (7D)" value={String(last7.length)} sub="this week" />
          <StatCard label="STREAK" value={`${streak.current}🔥`} sub={streak.hasToday ? "active" : "needs today"} color="#f59e0b" />
        </View>
        <View style={styles.statRow}>
          <StatCard label="WORDS (7D)" value={totalWords.toLocaleString()} />
          <StatCard label="STARRED" value={String(starred7.length)} sub="this week" color="#f59e0b" />
        </View>

        {/* Calendar heatmap */}
        <View style={[styles.card, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Last 12 weeks</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Tap a cell to filter the timeline</Text>
          <View style={styles.heatmapWrap}>
            {Array.from({ length: HEATMAP_WEEKS + 1 }).map((_, weekIdx) => (
              <View key={weekIdx} style={styles.heatColumn}>
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const cellIdx = weekIdx * 7 + dayIdx;
                  const cell = heatmap.cells[cellIdx];
                  if (!cell) return <View key={dayIdx} style={[styles.heatCell, { backgroundColor: "transparent" }]} />;
                  const intensity = heatmap.max === 0 ? 0 : cell.count / heatmap.max;
                  let bg = colors.background;
                  if (cell.count > 0) {
                    const opacity = Math.max(0.25, intensity);
                    bg = `rgba(168,85,247,${opacity.toFixed(2)})`;
                  } else if (!cell.isFuture) {
                    bg = colors.background;
                  } else {
                    bg = "transparent";
                  }
                  return (
                    <Pressable
                      key={dayIdx}
                      onPress={() => { router.dismissTo("/(tabs)" as any); }}
                      style={[styles.heatCell, { backgroundColor: bg, borderColor: colors.border, borderWidth: cell.count > 0 || !cell.isFuture ? StyleSheet.hairlineWidth : 0 }]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
          <View style={styles.heatLegend}>
            <Text style={[styles.heatLegendText, { color: colors.mutedForeground }]}>Less</Text>
            {[0.25, 0.5, 0.75, 1].map((o) => (
              <View key={o} style={[styles.heatCell, { backgroundColor: `rgba(168,85,247,${o})`, marginHorizontal: 0 }]} />
            ))}
            <Text style={[styles.heatLegendText, { color: colors.mutedForeground }]}>More</Text>
          </View>
        </View>

        {/* Tag breakdown */}
        <View style={[styles.card, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>By tag (7d)</Text>
          {tagBreakdown.length === 0 ? (
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>No entries this week.</Text>
          ) : (
            tagBreakdown.map(([tag, count]) => {
              const tc = getTagColor(tag, settings.customTags);
              const pct = (count / last7.length) * 100;
              return (
                <View key={tag} style={styles.tagRow}>
                  <View style={[styles.tagDot, { backgroundColor: tc }]} />
                  <Text style={[styles.tagLabel, { color: colors.foreground }]}>{tag}</Text>
                  <View style={[styles.tagBar, { backgroundColor: colors.background }]}>
                    <View style={[styles.tagBarFill, { width: `${pct}%`, backgroundColor: tc }]} />
                  </View>
                  <Text style={[styles.tagCount, { color: colors.mutedForeground }]}>{count}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Mood */}
        {moodCounts.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Mood (7d)</Text>
            <View style={styles.moodRow}>
              {moodCounts.map(([m, c]) => (
                <View key={m} style={[styles.moodChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={styles.moodEmoji}>{m}</Text>
                  <Text style={[styles.moodCount, { color: colors.mutedForeground }]}>×{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top words */}
        {topWords.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Top words (7d)</Text>
            <View style={styles.wordRow}>
              {topWords.map(([w, c]) => (
                <View key={w} style={[styles.wordChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.wordText, { color: colors.foreground }]}>{w}</Text>
                  <Text style={[styles.wordCount, { color: colors.mutedForeground }]}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Starred */}
        {starred7.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Starred (7d)</Text>
            {starred7.map((e) => {
              const tc = getTagColor(e.tag, settings.customTags);
              return (
                <Pressable
                  key={e.id}
                  onPress={() => router.push(`/entry/${e.id}` as any)}
                  style={[styles.entryRow, { borderColor: colors.border }]}
                >
                  <View style={[styles.tagDot, { backgroundColor: tc }]} />
                  <Text numberOfLines={1} style={[styles.entryTitle, { color: colors.foreground }]}>{e.title}</Text>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "transparent" },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  statRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, gap: 4 },
  statLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1.4 },
  statValue: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  statSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  card: { padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, gap: 10 },
  cardTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  heatmapWrap: { flexDirection: "row", gap: 4, justifyContent: "center" },
  heatColumn: { gap: 4 },
  heatCell: { width: 14, height: 14, borderRadius: 3 },
  heatLegend: { flexDirection: "row", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 6 },
  heatLegendText: { fontSize: 10, fontFamily: "Inter_500Medium", paddingHorizontal: 4 },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  tagLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", width: 80 },
  tagBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  tagBarFill: { height: "100%", borderRadius: 3 },
  tagCount: { fontSize: 12, fontFamily: "Inter_700Bold", minWidth: 24, textAlign: "right" },
  moodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moodChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth },
  moodEmoji: { fontSize: 18 },
  moodCount: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  wordRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  wordChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth },
  wordText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  wordCount: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#a855f7" },
  entryRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  entryTitle: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
});
