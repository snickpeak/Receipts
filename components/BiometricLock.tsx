import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hashCode, useSettings } from "@/context/SettingsContext";
import { useEntries } from "@/context/EntriesContext";
import { useColors } from "@/hooks/useColors";

async function tryBiometric(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const LA = require("expo-local-authentication");
    const hasHardware = await LA.hasHardwareAsync();
    const isEnrolled = await LA.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) return false;
    const result = await LA.authenticateAsync({
      promptMessage: "Unlock Receipts",
      fallbackLabel: "Use PIN",
    });
    return result.success === true;
  } catch {
    return false;
  }
}

const COOLDOWN_SECONDS = 30;
const MAX_ATTEMPTS = 5;

interface Props {
  onUnlock: () => void;
  onDecoyUnlock: () => void;
}

const DIGITS = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["", "0", "⌫"]];

export function BiometricLock({ onUnlock, onDecoyUnlock }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { deleteAllEntries } = useEntries();

  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryError, setRecoveryError] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const failedAttempts = settings.failedAttempts ?? 0;
  const lastUnlockTime = settings.lastUnlockTime ?? "";

  useEffect(() => {
    if (settings.biometricEnabled && Platform.OS !== "web") {
      tryBiometric().then((ok) => {
        if (ok) handleSuccessfulUnlock();
      });
    }
  }, []);

  // Cleanup cooldown timer
  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleSuccessfulUnlock = async () => {
    await updateSettings({ failedAttempts: 0, lastUnlockTime: new Date().toISOString() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onUnlock();
  };

  const handleDecoyUnlock = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDecoyUnlock();
  };

  const handleDigit = async (d: string) => {
    if (cooldown > 0) return;
    if (d === "⌫") { setInput((p) => p.slice(0, -1)); return; }
    if (d === "") return;

    const next = input + d;
    setInput(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (next.length === 4) {
      // Check decoy PIN first
      if (settings.decoyPin && next === settings.decoyPin) {
        handleDecoyUnlock();
        return;
      }
      // Check real PIN
      if (!settings.pin || next === settings.pin) {
        handleSuccessfulUnlock();
        return;
      }

      // Wrong PIN
      const newAttempts = failedAttempts + 1;
      await updateSettings({ failedAttempts: newAttempts });
      setError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // ── #4 Auto-wipe after N consecutive failures ─────────────────────────
      const wipeThreshold = settings.wipeAfterFails ?? 0;
      if (wipeThreshold > 0 && newAttempts >= wipeThreshold) {
        try {
          await deleteAllEntries();
          await updateSettings({
            failedAttempts: 0,
            pin: "",
            decoyPin: "",
            lockEnabled: false,
            biometricEnabled: false,
            recoveryCodeHashes: [],
          });
        } catch { /* swallow */ }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      setTimeout(() => {
        setInput("");
        setError(false);
        if (newAttempts >= MAX_ATTEMPTS) startCooldown();
      }, 700);
    }
  };

  const handleRecoveryCode = async () => {
    const code = recoveryInput.toUpperCase().replace(/\s/g, "");
    const hashed = hashCode(code);
    const valid = (settings.recoveryCodeHashes ?? []).includes(hashed);
    if (valid) {
      // Remove used code, clear PIN
      const remaining = (settings.recoveryCodeHashes ?? []).filter((h) => h !== hashed);
      await updateSettings({
        recoveryCodeHashes: remaining,
        pin: "",
        lockEnabled: false,
        failedAttempts: 0,
        lastUnlockTime: new Date().toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUnlock();
    } else {
      setRecoveryError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => { setRecoveryError(false); setRecoveryInput(""); }, 1500);
    }
  };

  const formatLastUnlock = () => {
    if (!lastUnlockTime) return null;
    const diff = Date.now() - new Date(lastUnlockTime).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Last unlocked: just now";
    if (mins < 60) return `Last unlocked: ${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Last unlocked: ${hours}h ago`;
    return `Last unlocked: ${Math.floor(hours / 24)}d ago`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]}>
      <Text style={[styles.brand, { color: colors.mutedForeground }]}>RECEIPTS</Text>

      {/* Failed attempt warning */}
      {failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && (
        <View style={[styles.warningBanner, { backgroundColor: "#f59e0b18", borderColor: "#f59e0b40" }]}>
          <Feather name="alert-triangle" size={13} color="#f59e0b" />
          <Text style={[styles.warningText, { color: "#f59e0b" }]}>
            {failedAttempts} failed attempt{failedAttempts > 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Cooldown banner */}
      {cooldown > 0 ? (
        <View style={styles.cooldownBlock}>
          <Feather name="shield" size={32} color="#ef4444" />
          <Text style={[styles.cooldownTitle, { color: colors.foreground }]}>Too many attempts</Text>
          <Text style={[styles.cooldownSub, { color: colors.mutedForeground }]}>Try again in {cooldown}s</Text>
        </View>
      ) : showRecovery ? (
        <View style={styles.recoveryBlock}>
          <Text style={[styles.title, { color: colors.foreground }]}>Enter recovery code</Text>
          <TextInput
            style={[styles.recoveryInput, { color: recoveryError ? "#ef4444" : colors.foreground, borderColor: recoveryError ? "#ef4444" : colors.border }]}
            value={recoveryInput}
            onChangeText={(t) => setRecoveryInput(t.toUpperCase())}
            placeholder="XXXXXXXX"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
          />
          {recoveryError && <Text style={styles.recoveryErrorText}>Invalid code — try another</Text>}
          <Pressable
            style={[styles.recoveryBtn, { backgroundColor: recoveryInput.length === 8 ? "#a855f7" : colors.muted }]}
            onPress={handleRecoveryCode}
            disabled={recoveryInput.length < 8}
          >
            <Text style={[styles.recoveryBtnText, { color: recoveryInput.length === 8 ? "#fff" : colors.mutedForeground }]}>
              Unlock with Code
            </Text>
          </Pressable>
          <Pressable onPress={() => setShowRecovery(false)} style={styles.cancelRecovery}>
            <Text style={[styles.cancelRecoveryText, { color: colors.mutedForeground }]}>← Back to PIN</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {settings.pin ? "Enter your PIN" : "Tap to unlock"}
          </Text>

          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i < input.length ? (error ? "#ef4444" : colors.foreground) : colors.muted }]} />
            ))}
          </View>

          {error && <Text style={styles.errorText}>Incorrect PIN</Text>}

          <View style={styles.keypad}>
            {DIGITS.map((row, ri) => (
              <View key={ri} style={styles.keyRow}>
                {row.map((d, di) => (
                  <Pressable
                    key={di}
                    style={({ pressed }) => [styles.key, {
                      backgroundColor: d === "" ? "transparent" : pressed ? colors.muted : colors.secondary,
                      opacity: d === "" ? 0 : 1,
                    }]}
                    onPress={() => handleDigit(d)}
                    disabled={d === ""}
                  >
                    <Text style={[styles.keyText, { color: colors.foreground }]}>{d}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>

          {settings.biometricEnabled && Platform.OS !== "web" && (
            <Pressable style={styles.biometricBtn} onPress={() => tryBiometric().then((ok) => { if (ok) handleSuccessfulUnlock(); })}>
              <LinearGradient colors={["#a855f722", "transparent"]} style={styles.biometricGradient}>
                <Feather name="cpu" size={22} color="#a855f7" />
              </LinearGradient>
              <Text style={[styles.biometricText, { color: colors.mutedForeground }]}>Use Biometrics</Text>
            </Pressable>
          )}

          {/* Recovery code link */}
          {(settings.recoveryCodeHashes ?? []).length > 0 && (
            <Pressable onPress={() => setShowRecovery(true)} style={styles.recoveryLink}>
              <Text style={[styles.recoveryLinkText, { color: colors.mutedForeground }]}>Use recovery code</Text>
            </Pressable>
          )}
        </>
      )}

      {/* Last unlock info */}
      {!showRecovery && formatLastUnlock() && (
        <Text style={[styles.lastUnlock, { color: colors.mutedForeground }]}>{formatLastUnlock()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  brand: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 3, position: "absolute", top: 60 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  warningBanner: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  warningText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dotsRow: { flexDirection: "row", gap: 14, marginVertical: 10 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  errorText: { color: "#ef4444", fontFamily: "Inter_500Medium", fontSize: 14 },
  keypad: { gap: 12, marginTop: 10 },
  keyRow: { flexDirection: "row", gap: 12 },
  key: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  keyText: { fontSize: 26, fontFamily: "Inter_400Regular" },
  biometricBtn: { alignItems: "center", gap: 8, marginTop: 16 },
  biometricGradient: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  biometricText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  cooldownBlock: { alignItems: "center", gap: 12 },
  cooldownTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  cooldownSub: { fontSize: 15, fontFamily: "Inter_400Regular" },
  recoveryBlock: { width: "100%", paddingHorizontal: 32, gap: 16, alignItems: "center" },
  recoveryInput: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 6, textAlign: "center", borderWidth: 1, borderRadius: 12, padding: 14, width: "100%" },
  recoveryErrorText: { color: "#ef4444", fontFamily: "Inter_500Medium", fontSize: 13 },
  recoveryBtn: { width: "100%", padding: 15, borderRadius: 12, alignItems: "center" },
  recoveryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  cancelRecovery: { paddingVertical: 6 },
  cancelRecoveryText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  recoveryLink: { marginTop: 8, paddingVertical: 6 },
  recoveryLinkText: { fontSize: 13, fontFamily: "Inter_400Regular", textDecorationLine: "underline" },
  lastUnlock: { fontSize: 11, fontFamily: "Inter_400Regular", position: "absolute", bottom: 40 },
});
