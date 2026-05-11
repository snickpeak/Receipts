import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEntries } from "@/context/EntriesContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { clusterThreads } from "@/lib/threadsLib";
import { getTagColor } from "@/lib/tagsLib";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" });
}

export default function ThreadsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries } = useEntries();
  const { settings } = useSettings();
  const threads = useMemo(() => clusterThreads(entries.filter((e) => !e.locked)), [entries]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="x" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Memory Threads</Text>
        <View style={styles.iconBtn} />
      </View>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Auto-grouped clusters of related entries by tag and time.
      </Text>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
        {threads.length === 0 ? (
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>
            No clusters yet. Threads form when you have 2+ entries of the same tag within ~14 days.
          </Text>
        ) : (
          threads.map((th) => {
            const color = getTagColor(th.tag, settings.customTags);
            return (
              <View key={th.id} style={[styles.card, { borderColor: color + "30" }]}>
                <LinearGradient colors={[color + "20", color + "06", "transparent"]} style={StyleSheet.absoluteFill} />
                <View style={styles.cardHeader}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{th.title}</Text>
                  <Text style={[styles.cardCount, { color: colors.mutedForeground }]}>{th.entries.length}</Text>
                </View>
                <Text style={[styles.cardRange, { color: colors.mutedForeground }]}>
                  {fmt(th.start)} → {fmt(th.end)} · {th.tag}
                </Text>
                {th.entries.slice(0, 3).map((e) => (
                  <Pressable key={e.id} onPress={() => router.push(`/entry/${e.id}`)} style={styles.row}>
                    <Feather name="circle" size={6} color={colors.mutedForeground} />
                    <Text numberOfLines={1} style={[styles.rowText, { color: colors.foreground }]}>{e.title}</Text>
                  </Pressable>
                ))}
                {th.entries.length > 3 && (
                  <Text style={[styles.more, { color: colors.mutedForeground }]}>
                    +{th.entries.length - 3} more
                  </Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 13, paddingHorizontal: 16, marginTop: 4, marginBottom: 8 },
  empty: { fontSize: 14, textAlign: "center", marginTop: 60, paddingHorizontal: 24, lineHeight: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: "700" },
  cardCount: { fontSize: 13, fontWeight: "600" },
  cardRange: { fontSize: 12, marginTop: 4, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  rowText: { flex: 1, fontSize: 14 },
  more: { fontSize: 12, marginTop: 6, fontStyle: "italic" },
});
