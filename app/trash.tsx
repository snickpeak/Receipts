import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedListItem } from "@/components/animations";
import { useEntries, TRASH_TTL_DAYS, type Entry } from "@/context/EntriesContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { getTagColor } from "@/lib/tagsLib";

const DAY = 24 * 60 * 60 * 1000;

function daysLeft(trashedAt: string): number {
  const trashedTime = new Date(trashedAt).getTime();
  const left = TRASH_TTL_DAYS - Math.floor((Date.now() - trashedTime) / DAY);
  return Math.max(0, left);
}

function TrashRow({ entry, onRestore, onDelete }: { entry: Entry; onRestore: () => void; onDelete: () => void }) {
  const colors = useColors();
  const { settings } = useSettings();
  const tc = getTagColor(entry.tag, settings.customTags);
  const left = entry.trashedAt ? daysLeft(entry.trashedAt) : TRASH_TTL_DAYS;
  return (
    <View style={[styles.row, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: tc }]} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>{entry.title || "Untitled"}</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {entry.tag} · {left === 0 ? "Purges soon" : `${left}d left`}
        </Text>
      </View>
      <Pressable onPress={onRestore} hitSlop={8} style={[styles.actionBtn, { backgroundColor: "#22c55e22" }]}>
        <Feather name="rotate-ccw" size={14} color="#22c55e" />
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={8} style={[styles.actionBtn, { backgroundColor: "#ef444422" }]}>
        <Feather name="trash-2" size={14} color="#ef4444" />
      </Pressable>
    </View>
  );
}

export default function TrashScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { trashedEntries, restoreEntry, permanentlyDelete, emptyTrash } = useEntries();

  const sorted = [...trashedEntries].sort((a, b) => +new Date(b.trashedAt ?? 0) - +new Date(a.trashedAt ?? 0));

  const confirm = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === "web") { onConfirm(); return; }
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", style: "destructive", onPress: onConfirm },
    ]);
  };

  const handleEmpty = () => {
    if (sorted.length === 0) return;
    confirm("Empty trash", `Permanently delete ${sorted.length} entries? This cannot be undone.`, async () => {
      await emptyTrash();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="x" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Recently Deleted</Text>
        <Pressable
          onPress={handleEmpty}
          disabled={sorted.length === 0}
          style={[styles.iconBtn, { opacity: sorted.length === 0 ? 0.3 : 1 }]}
        >
          <Feather name="trash-2" size={18} color="#ef4444" />
        </Pressable>
      </View>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Items here are removed forever after {TRASH_TTL_DAYS} days.
      </Text>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 8 }}>
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="trash-2" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Trash is empty</Text>
          </View>
        ) : (
          sorted.map((e, i) => (
            <AnimatedListItem key={e.id} index={i} staggerMs={50}>
              <TrashRow
                entry={e}
                onRestore={async () => { await restoreEntry(e.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
                onDelete={() => confirm("Delete forever", "Permanently delete this entry?", async () => {
                  await permanentlyDelete(e.id);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                })}
              />
            </AnimatedListItem>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 4 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", paddingHorizontal: 16, paddingBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  actionBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 60 },
  emptyText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
