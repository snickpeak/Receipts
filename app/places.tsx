import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEntries } from "@/context/EntriesContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { getTagColor } from "@/lib/tagsLib";

function openInMaps(lat: number, lng: number, label: string) {
  const q = encodeURIComponent(label);
  const url = Platform.select({
    ios: `http://maps.apple.com/?ll=${lat},${lng}&q=${q}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${q})`,
    default: `https://www.google.com/maps?q=${lat},${lng}`,
  });
  if (url) Linking.openURL(url).catch(() => {});
}

export default function PlacesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries } = useEntries();
  const { settings } = useSettings();
  const geoEntries = useMemo(
    () => entries.filter((e) => !e.locked && typeof e.latitude === "number" && typeof e.longitude === "number"),
    [entries],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="x" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Places</Text>
        <View style={styles.iconBtn} />
      </View>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Geo-tagged entries. Only entries you explicitly captured with location appear here.
      </Text>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
        {geoEntries.length === 0 ? (
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>
            No geo-tagged entries yet. Enable “Geo-tagging” in Settings, then create an entry to capture its location.
          </Text>
        ) : (
          geoEntries.map((e) => {
            const color = getTagColor(e.tag, settings.customTags);
            return (
              <Pressable
                key={e.id}
                onPress={() => router.push(`/entry/${e.id}`)}
                style={({ pressed }) => [styles.card, { borderColor: color + "30", opacity: pressed ? 0.7 : 1 }]}
              >
                <LinearGradient colors={[color + "18", color + "04", "transparent"]} style={StyleSheet.absoluteFill} />
                <View style={styles.cardHeader}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.foreground }]}>{e.title}</Text>
                </View>
                <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                  {e.place ?? `${e.latitude!.toFixed(4)}, ${e.longitude!.toFixed(4)}`}
                </Text>
                <Pressable
                  onPress={() => openInMaps(e.latitude!, e.longitude!, e.title)}
                  style={[styles.mapBtn, { backgroundColor: color + "22" }]}
                >
                  <Feather name="map-pin" size={13} color={color} />
                  <Text style={[styles.mapBtnText, { color }]}>Open in Maps</Text>
                </Pressable>
              </Pressable>
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
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "600" },
  cardMeta: { fontSize: 12, marginTop: 4, marginLeft: 16 },
  mapBtn: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginTop: 8, marginLeft: 16 },
  mapBtnText: { fontSize: 12, fontWeight: "600" },
});
