import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring, withSequence } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedListItem } from "@/components/animations";
import { useEntries, type Entry, type Tag } from "@/context/EntriesContext";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { semanticSearch } from "@/lib/semanticSearch";

const TAG_COLORS: Record<Tag, string> = {
  Money: "#22c55e", Promise: "#3b82f6", Memory: "#a855f7", Win: "#f59e0b", Proof: "#ef4444",
};
const ALL_TAGS: Tag[] = ["Win", "Money", "Memory", "Promise", "Proof"];

type FilterTag = Tag | "Starred";
const FILTER_CHIPS: { label: FilterTag; color: string; icon: string }[] = [
  { label: "Starred", color: "#f59e0b", icon: "star" },
  { label: "Win", color: "#f59e0b", icon: "award" },
  { label: "Money", color: "#22c55e", icon: "dollar-sign" },
  { label: "Memory", color: "#a855f7", icon: "heart" },
  { label: "Promise", color: "#3b82f6", icon: "check-circle" },
  { label: "Proof", color: "#ef4444", icon: "shield" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("default", { month: "short", day: "numeric" });
}

function AnimatedFilterChip({ active, chip, mutedBg, mutedFg, onPress }: { active: boolean; chip: { label: string; color: string; icon: string }; mutedBg: string; mutedFg: string; onPress: () => void }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => {
          if (!reduceMotion) {
            scale.value = withSequence(
              withTiming(0.88, { duration: 80 }),
              withSpring(1, { damping: 12, stiffness: 200 })
            );
          }
          onPress();
        }}
        style={[
          styles.filterChip,
          { backgroundColor: active ? chip.color + "25" : mutedBg, borderColor: active ? chip.color + "55" : "transparent", borderWidth: active ? 1 : 0 },
        ]}
      >
        <Feather name={chip.icon as any} size={12} color={active ? chip.color : mutedFg} />
        <Text style={[styles.filterChipText, { color: active ? chip.color : mutedFg }]}>{chip.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function SearchResultCard({ entry }: { entry: Entry }) {
  const colors = useColors();
  const tagColor = TAG_COLORS[entry.tag as Tag] ?? "#fff";
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
    <Pressable
      onPress={() => router.push(`/entry/${entry.id}`)}
      onPressIn={() => { scale.value = withTiming(0.97, { duration: 100 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }); }}
      style={[cardStyles.wrapper]}
    >
      <LinearGradient
        colors={[tagColor + "14", tagColor + "03", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[cardStyles.gradient, { borderColor: tagColor + "25" }]}
      >
        <View style={cardStyles.inner}>
          <View style={cardStyles.topRow}>
            <View style={cardStyles.tagRow}>
              <View style={[cardStyles.dot, { backgroundColor: tagColor }]} />
              <Text style={[cardStyles.tagLabel, { color: tagColor }]}>{entry.tag.toUpperCase()}</Text>
              {entry.starred && <Feather name="star" size={10} color="#f59e0b" />}
            </View>
            <Text style={[cardStyles.date, { color: colors.mutedForeground }]}>{formatDate(entry.createdAt)}</Text>
          </View>
          <Text style={[cardStyles.title, { color: colors.foreground }]} numberOfLines={2}>{entry.title}</Text>
          {(entry.note || entry.aiSummary) ? (
            <Text style={[cardStyles.note, { color: colors.mutedForeground }]} numberOfLines={2}>
              {entry.note ?? entry.aiSummary}
            </Text>
          ) : null}
        </View>
      </LinearGradient>
    </Pressable>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: { marginBottom: 10 },
  gradient: { borderRadius: 16, borderWidth: 1 },
  inner: { padding: 16, gap: 7 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  tagLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  date: { fontSize: 12, fontFamily: "Inter_400Regular" },
  title: { fontSize: 15, fontFamily: "Inter_600SemiBold", letterSpacing: -0.2, lineHeight: 21 },
  note: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});

export default function SearchScreen() {
  const colors = useColors();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { entries } = useEntries();
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<FilterTag>>(new Set());
  // #15 Semantic search — local TF-IDF cosine similarity on the visible entries.
  const [semantic, setSemantic] = useState(false);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  const toggleFilter = (filter: FilterTag) => {
    Haptics.selectionAsync();
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };

  const results = useMemo<Entry[]>(() => {
    let filtered = entries.filter((e) => !e.locked);
    if (activeFilters.has("Starred")) filtered = filtered.filter((e) => e.starred);
    const tagFilters = ALL_TAGS.filter((t) => activeFilters.has(t));
    if (tagFilters.length > 0) filtered = filtered.filter((e) => tagFilters.includes(e.tag));
    if (query.trim()) {
      if (semantic) {
        const ranked = semanticSearch(filtered, query, 50);
        return ranked.map((r) => r.entry);
      }
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.note.toLowerCase().includes(q) ||
          (e.aiSummary ?? "").toLowerCase().includes(q) ||
          e.tag.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [entries, query, activeFilters, semantic]);

  const hasFilters = query.length > 0 || activeFilters.size > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>{t.search.title}</Text>

        <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={t.search.placeholder}
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setSemantic((s) => !s); }}
            style={[styles.smartToggle, { backgroundColor: semantic ? "#a855f730" : colors.muted, borderColor: semantic ? "#a855f7" : "transparent" }]}
            hitSlop={6}
          >
            <Feather name="sliders" size={11} color={semantic ? "#a855f7" : colors.mutedForeground} />
            <Text style={[styles.smartToggleText, { color: semantic ? "#a855f7" : colors.mutedForeground }]}>Ranking</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilters.has(chip.label);
            return (
              <AnimatedFilterChip key={chip.label} active={active} chip={chip} mutedBg={colors.muted} mutedFg={colors.mutedForeground} onPress={() => toggleFilter(chip.label)} />
            );
          })}
        </ScrollView>
      </View>

      {results.length === 0 ? (
        <View style={[styles.emptyState, { paddingBottom: bottomInset }]}>
          <LinearGradient colors={["#3b82f615", "transparent"]} style={styles.emptyIconWrap}>
            <Feather name="search" size={28} color="#3b82f6" />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {hasFilters ? t.search.noResults : t.search.startSearching}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            {hasFilters ? t.search.noResultsSub : t.search.startSearchingSub}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index} staggerMs={40}>
              <SearchResultCard entry={item} />
            </AnimatedListItem>
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            hasFilters ? (
              <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
                {results.length} {results.length === 1 ? t.common.result : t.common.results}
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  screenTitle: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.6 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  filtersRow: { gap: 8, paddingRight: 4 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100 },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  smartToggle: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  smartToggleText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.6 },
  listContent: { padding: 16 },
  resultCount: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 10, letterSpacing: 0.3 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
