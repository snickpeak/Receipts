import { Feather } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

import { useColors } from "@/hooks/useColors";

type SetupStep = "scan" | "verify" | "backup";

const APPS = [
  { name: "Google Authenticator", icon: "smartphone" },
  { name: "Authy", icon: "shield" },
  { name: "1Password", icon: "key" },
  { name: "Microsoft Authenticator", icon: "lock" },
] as const;

function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

export default function SetupTOTPScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottom = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState<SetupStep>("scan");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    async function init() {
      if (!user) return;
      try {
        const totp = await user.createTOTP();
        setTotpUri(totp.uri ?? null);
        setTotpSecret(totp.secret ?? null);
      } catch (err: any) {
        setInitError(err?.errors?.[0]?.message ?? "Could not start 2FA setup. Please try again.");
      } finally {
        setInitLoading(false);
      }
    }
    init();
  }, [user]);

  const handleVerify = async () => {
    if (!user || code.length < 6) return;
    setLoading(true);
    setVerifyError("");
    try {
      const totp = await user.verifyTOTP({ code });
      let codes: string[] = totp.backupCodes ?? [];
      if (codes.length === 0) {
        try {
          const bc = await user.createBackupCode();
          codes = bc.codes ?? [];
        } catch {}
      }
      setBackupCodes(codes);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("backup");
    } catch (err: any) {
      setVerifyError(err?.errors?.[0]?.message ?? "Invalid code. Open your authenticator app and try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const sharedContainer: any = {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingTop: top + 16,
    paddingBottom: bottom + 24,
    paddingHorizontal: 24,
    gap: 20,
  };

  if (initLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color="#a855f7" size="large" />
        <Text style={[styles.initText, { color: colors.mutedForeground }]}>Setting up…</Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color="#ef4444" />
        <Text style={[styles.initText, { color: "#ef4444" }]}>{initError}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.mutedForeground }]}>← Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (step === "scan") {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={sharedContainer} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.closeRow}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>

          <LinearGradient colors={["#a855f730", "transparent"]} style={styles.iconCircle}>
            <Feather name="shield" size={28} color="#a855f7" />
          </LinearGradient>

          <Text style={[styles.title, { color: colors.foreground }]}>Set up authenticator</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Scan the QR code below with any authenticator app.
          </Text>

          {totpUri ? (
            <View style={styles.qrCard}>
              <QRCode
                value={totpUri}
                size={200}
                color="#111"
                backgroundColor="#fff"
                ecl="M"
              />
            </View>
          ) : (
            <View style={styles.qrCard}>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>QR code unavailable</Text>
            </View>
          )}

          <Pressable onPress={() => setShowManual((v) => !v)} style={styles.manualToggle}>
            <Feather name={showManual ? "chevron-up" : "chevron-down"} size={14} color="#a855f7" />
            <Text style={styles.manualToggleText}>{showManual ? "Hide" : "Can't scan? Enter manually"}</Text>
          </Pressable>

          {showManual && totpSecret && (
            <View style={[styles.secretCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.secretLabel, { color: colors.mutedForeground }]}>SETUP KEY</Text>
              <Text selectable style={[styles.secretValue, { color: colors.foreground }]}>
                {formatSecret(totpSecret)}
              </Text>
              <Text style={[styles.secretHint, { color: colors.mutedForeground }]}>
                Tap and hold to copy
              </Text>
            </View>
          )}

          <View style={[styles.appsCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.appsTitle, { color: colors.mutedForeground }]}>Compatible apps</Text>
            <View style={styles.appsGrid}>
              {APPS.map((app) => (
                <View key={app.name} style={styles.appChip}>
                  <Feather name={app.icon as any} size={13} color={colors.mutedForeground} />
                  <Text style={[styles.appName, { color: colors.foreground }]}>{app.name}</Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => setStep("verify")}
          >
            <Text style={styles.primaryBtnText}>I've scanned the code</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === "verify") {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={sharedContainer} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => setStep("scan")} style={styles.closeRow}>
            <Feather name="arrow-left" size={22} color={colors.mutedForeground} />
          </Pressable>

          <LinearGradient colors={["#a855f730", "transparent"]} style={styles.iconCircle}>
            <Feather name="check-circle" size={28} color="#a855f7" />
          </LinearGradient>

          <Text style={[styles.title, { color: colors.foreground }]}>Enter confirmation code</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Open your authenticator app and enter the 6-digit code shown for this account.
          </Text>

          <TextInput
            style={[
              styles.codeInput,
              {
                backgroundColor: colors.muted,
                borderColor: verifyError ? "#ef4444" : colors.border,
                color: colors.foreground,
              },
            ]}
            value={code}
            onChangeText={(t) => { setCode(t.replace(/\D/g, "").slice(0, 6)); setVerifyError(""); }}
            placeholder="000000"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            textAlign="center"
            autoFocus
            maxLength={6}
          />

          {verifyError ? <Text style={styles.errorText}>{verifyError}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: code.length < 6 || loading ? 0.5 : pressed ? 0.8 : 1 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleVerify(); }}
            disabled={code.length < 6 || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify & Enable 2FA</Text>}
          </Pressable>

          <Pressable onPress={() => setStep("scan")} style={styles.textLink}>
            <Text style={[styles.textLinkText, { color: colors.mutedForeground }]}>← Back to QR code</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView contentContainerStyle={sharedContainer}>
      <LinearGradient colors={["#22c55e30", "transparent"]} style={styles.iconCircle}>
        <Feather name="check-circle" size={28} color="#22c55e" />
      </LinearGradient>

      <Text style={[styles.title, { color: colors.foreground }]}>2FA is enabled!</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Save these backup codes somewhere safe. Each code can be used once if you ever lose access to your authenticator.
      </Text>

      {backupCodes.length > 0 && (
        <View style={[styles.codesCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <View style={styles.codesWarningRow}>
            <Feather name="alert-triangle" size={13} color="#f59e0b" />
            <Text style={[styles.codesWarning, { color: "#f59e0b" }]}>These codes won't be shown again</Text>
          </View>
          <View style={styles.codesGrid}>
            {backupCodes.map((bc, i) => (
              <View key={i} style={[styles.codeChip, { backgroundColor: colors.secondary ?? colors.background, borderColor: colors.border }]}>
                <Text selectable style={[styles.codeChipText, { color: colors.foreground }]}>{bc}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {backupCodes.length === 0 && (
        <View style={[styles.codesCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Backup codes were not generated. You can generate them from your account settings.
          </Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.8 : 1 }]}
        onPress={handleDone}
      >
        <Text style={styles.primaryBtnText}>I've saved my codes</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  initText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  closeRow: { alignSelf: "flex-start" },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  qrCard: { alignSelf: "center", backgroundColor: "#fff", padding: 16, borderRadius: 16 },
  manualToggle: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center" },
  manualToggleText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#a855f7" },
  secretCard: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 8 },
  secretLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  secretValue: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 4, lineHeight: 24 },
  secretHint: { fontSize: 11, fontFamily: "Inter_400Regular" },
  appsCard: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
  appsTitle: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  appsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  appChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  appName: { fontSize: 12, fontFamily: "Inter_400Regular" },
  codeInput: { borderWidth: 1, borderRadius: 14, padding: 18, fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: 10 },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#ef4444", textAlign: "center" },
  primaryBtn: { backgroundColor: "#a855f7", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 4 },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  textLink: { alignItems: "center", paddingVertical: 8 },
  textLinkText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  backBtn: { marginTop: 8 },
  backBtnText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  codesCard: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 14 },
  codesWarningRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  codesWarning: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  codesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  codeChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  codeChipText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1 },
});
