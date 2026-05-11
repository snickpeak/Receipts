import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Settings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import {
  composeHomeLocationLine,
  searchPhotonLocations,
  type LocationSuggestion,
} from "@/lib/photonGeocode";

type Props = {
  visible: boolean;
  onClose: () => void;
  settings: Pick<Settings, "homeLocation" | "homeCity" | "homeCountry">;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  settingsLoaded: boolean;
};

export function HomeLocationPickerModal({
  visible,
  onClose,
  settings,
  updateSettings,
  settingsLoaded,
}: Props) {
  const colors = useColors();
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!visible || !settingsLoaded) return;
    const line = composeHomeLocationLine(settings.homeCity ?? "", settings.homeCountry ?? "");
    setSearchText(line || settings.homeLocation?.trim() || "");
    setSuggestions([]);
    setLoading(false);
  }, [
    visible,
    settingsLoaded,
    settings.homeCity,
    settings.homeCountry,
    settings.homeLocation,
  ]);

  useEffect(() => {
    if (!visible) return;
    const q = searchText.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const t = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const list = await searchPhotonLocations(q, ac.signal);
          if (!ac.signal.aborted) setSuggestions(list);
        } finally {
          if (!ac.signal.aborted) setLoading(false);
        }
      })();
    }, 420);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [visible, searchText]);

  const close = () => {
    setSuggestions([]);
    onClose();
  };

  const applySuggestion = useCallback(
    async (s: LocationSuggestion) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const line = composeHomeLocationLine(s.city, s.country);
      setSearchText(line);
      setSuggestions([]);
      await updateSettings({
        homeCity: s.city,
        homeCountry: s.country,
        homeLocation: line,
      });
    },
    [updateSettings],
  );

  const onCityChange = useCallback(
    async (v: string) => {
      await updateSettings({
        homeCity: v,
        homeLocation: composeHomeLocationLine(v, settings.homeCountry ?? ""),
      });
    },
    [settings.homeCountry, updateSettings],
  );

  const onCountryChange = useCallback(
    async (v: string) => {
      await updateSettings({
        homeCountry: v,
        homeLocation: composeHomeLocationLine(settings.homeCity ?? "", v),
      });
    },
    [settings.homeCity, updateSettings],
  );

  const clearLocation = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchText("");
    setSuggestions([]);
    await updateSettings({ homeCity: "", homeCountry: "", homeLocation: "" });
  };

  const inputStyle = [
    styles.input,
    {
      color: colors.foreground,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalCard,
            styles.modalCardTall,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Home location</Text>
          <Text style={[styles.modalHint, { color: colors.mutedForeground }]}>
            Search for a place, choose a match, or edit city and country below.
          </Text>

          <View style={[styles.searchWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="search" size={14} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="e.g. Austin, 90210, SW1A 1AA"
              placeholderTextColor={colors.mutedForeground}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchText.length > 0 && Platform.OS !== "ios" && (
              <Pressable onPress={() => setSearchText("")} hitSlop={8}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#a855f7" />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Looking up…</Text>
            </View>
          ) : null}

          {suggestions.length > 0 ? (
            <View
              style={[
                styles.suggestionList,
                { borderColor: colors.border, backgroundColor: colors.muted },
              ]}
            >
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                style={{ maxHeight: 220 }}
              >
                {suggestions.map((s, i) => (
                  <Pressable
                    key={s.id}
                    onPress={() => void applySuggestion(s)}
                    style={[
                      styles.suggestionRow,
                      {
                        borderBottomWidth: i === suggestions.length - 1 ? 0 : StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Feather name="navigation" size={14} color="#a855f7" />
                    <Text style={[styles.suggestionText, { color: colors.foreground }]} numberOfLines={2}>
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>City</Text>
            <TextInput
              style={inputStyle}
              value={settings.homeCity ?? ""}
              onChangeText={(v) => void onCityChange(v)}
              placeholder="City"
              placeholderTextColor={colors.mutedForeground}
              autoCorrect={false}
              autoCapitalize="words"
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Country</Text>
            <TextInput
              style={inputStyle}
              value={settings.homeCountry ?? ""}
              onChangeText={(v) => void onCountryChange(v)}
              placeholder="Country"
              placeholderTextColor={colors.mutedForeground}
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>

          <Pressable onPress={() => void clearLocation()}>
            <Text style={[styles.clearText, { color: "#ef4444" }]}>Clear home location</Text>
          </Pressable>

          <Pressable onPress={close}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#00000088",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 12,
  },
  modalCardTall: { maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalHint: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", padding: 0 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  loadingText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  suggestionList: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  suggestionText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 19 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  clearText: { textAlign: "center", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cancelText: { textAlign: "center", fontSize: 13, fontFamily: "Inter_500Medium" },
});
