import { Feather } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/PressableScale";
import { useColors } from "@/hooks/useColors";

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: enabled ? "#22c55e22" : "#88888822" }]}>
      <View style={[styles.badgeDot, { backgroundColor: enabled ? "#22c55e" : "#888" }]} />
      <Text style={[styles.badgeText, { color: enabled ? "#22c55e" : "#888" }]}>
        {enabled ? "Enabled" : "Not set up"}
      </Text>
    </View>
  );
}

export default function TwoFactorScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottom = Platform.OS === "web" ? 34 : insets.bottom;

  const [totpDisabling, setTotpDisabling] = useState(false);
  const [smsDisabling, setSmsDisabling] = useState(false);

  const smsPhone = user?.phoneNumbers?.find((p) => p.reservedForSecondFactor);
  const totpEnabled = !!user?.totpEnabled;
  const smsEnabled = !!smsPhone;

  const handleDisableTOTP = () => {
    if (!user) return;
    Alert.alert(
      "Disable Authenticator App",
      "You'll no longer be asked for a code from your authenticator app when signing in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            setTotpDisabling(true);
            try {
              await user.disableTOTP();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              Alert.alert("Error", "Could not disable authenticator app 2FA. Please try again.");
            } finally {
              setTotpDisabling(false);
            }
          },
        },
      ]
    );
  };

  const handleDisableSMS = () => {
    if (!user || !smsPhone) return;
    Alert.alert(
      "Disable SMS Authentication",
      `Remove ${smsPhone.phoneNumber} as a second factor?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            setSmsDisabling(true);
            try {
              await smsPhone.setReservedForSecondFactor({ reserved: false });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              Alert.alert("Error", "Could not disable SMS 2FA. Please try again.");
            } finally {
              setSmsDisabling(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: top + 16,
        paddingBottom: bottom + 32,
        paddingHorizontal: 20,
        gap: 16,
      }}
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={22} color={colors.mutedForeground} />
      </Pressable>

      <View style={{ gap: 6, marginBottom: 4 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>Two-Factor Authentication</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Add a second layer of security to your account. You can enable both methods.
        </Text>
      </View>

      {(!totpEnabled && !smsEnabled) && (
        <View style={[styles.warningCard, { backgroundColor: "#f59e0b18", borderColor: "#f59e0b44" }]}>
          <Feather name="alert-triangle" size={14} color="#f59e0b" />
          <Text style={[styles.warningText, { color: "#f59e0b" }]}>
            No 2FA is enabled. Your account is protected by password only.
          </Text>
        </View>
      )}

      {(totpEnabled || smsEnabled) && (
        <View style={[styles.warningCard, { backgroundColor: "#22c55e18", borderColor: "#22c55e44" }]}>
          <Feather name="shield" size={14} color="#22c55e" />
          <Text style={[styles.warningText, { color: "#22c55e" }]}>
            {totpEnabled && smsEnabled
              ? "Both methods are active — your account is well protected."
              : "One method is active. Consider enabling a second as backup."}
          </Text>
        </View>
      )}

      {/* TOTP Card */}
      <View style={[styles.methodCard, { backgroundColor: colors.muted, borderColor: totpEnabled ? "#a855f744" : colors.border }]}>
        <LinearGradient
          colors={totpEnabled ? ["#a855f730", "transparent"] : ["#88888818", "transparent"]}
          style={styles.methodIconWrap}
        >
          <Feather name="shield" size={22} color={totpEnabled ? "#a855f7" : colors.mutedForeground} />
        </LinearGradient>

        <View style={styles.methodBody}>
          <View style={styles.methodHeader}>
            <Text style={[styles.methodTitle, { color: colors.foreground }]}>Authenticator App</Text>
            <StatusBadge enabled={totpEnabled} />
          </View>
          <Text style={[styles.methodDesc, { color: colors.mutedForeground }]}>
            Use Google Authenticator, Authy, 1Password, or any TOTP app to generate time-based codes.
          </Text>

          {totpEnabled ? (
            <PressableScale
              onPress={handleDisableTOTP}
              disabled={totpDisabling}
              haptic="medium"
              style={[styles.actionBtn, styles.disableBtn]}
            >
              {totpDisabling ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <>
                  <Feather name="x-circle" size={14} color="#ef4444" />
                  <Text style={styles.disableBtnText}>Disable</Text>
                </>
              )}
            </PressableScale>
          ) : (
            <PressableScale
              onPress={() => router.push("/setup-totp" as any)}
              haptic="light"
              style={[styles.actionBtn, styles.setupBtn]}
            >
              <Feather name="plus-circle" size={14} color="#a855f7" />
              <Text style={styles.setupBtnText}>Set up</Text>
            </PressableScale>
          )}
        </View>
      </View>

      {/* SMS Card */}
      <View style={[styles.methodCard, { backgroundColor: colors.muted, borderColor: smsEnabled ? "#a855f744" : colors.border }]}>
        <LinearGradient
          colors={smsEnabled ? ["#a855f730", "transparent"] : ["#88888818", "transparent"]}
          style={styles.methodIconWrap}
        >
          <Feather name="message-square" size={22} color={smsEnabled ? "#a855f7" : colors.mutedForeground} />
        </LinearGradient>

        <View style={styles.methodBody}>
          <View style={styles.methodHeader}>
            <Text style={[styles.methodTitle, { color: colors.foreground }]}>SMS Text Message</Text>
            <StatusBadge enabled={smsEnabled} />
          </View>
          <Text style={[styles.methodDesc, { color: colors.mutedForeground }]}>
            {smsEnabled
              ? `Codes sent to ${smsPhone!.phoneNumber}`
              : "Receive a one-time code via text message when signing in."}
          </Text>

          {smsEnabled ? (
            <PressableScale
              onPress={handleDisableSMS}
              disabled={smsDisabling}
              haptic="medium"
              style={[styles.actionBtn, styles.disableBtn]}
            >
              {smsDisabling ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <>
                  <Feather name="x-circle" size={14} color="#ef4444" />
                  <Text style={styles.disableBtnText}>Disable</Text>
                </>
              )}
            </PressableScale>
          ) : (
            <PressableScale
              onPress={() => router.push("/setup-sms" as any)}
              haptic="light"
              style={[styles.actionBtn, styles.setupBtn]}
            >
              <Feather name="plus-circle" size={14} color="#a855f7" />
              <Text style={styles.setupBtnText}>Set up</Text>
            </PressableScale>
          )}
        </View>
      </View>

      {/* Backup codes note */}
      <View style={[styles.noteCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="key" size={14} color={colors.mutedForeground} />
        <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
          Backup codes were generated when you set up your authenticator app. Use them if you lose access to all 2FA methods.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backBtn: { alignSelf: "flex-start" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  warningText: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18, flex: 1 },
  methodCard: {
    flexDirection: "row",
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  methodIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  methodBody: { flex: 1, gap: 8 },
  methodHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  methodTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  methodDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 2,
  },
  setupBtn: { backgroundColor: "#a855f720" },
  setupBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#a855f7" },
  disableBtn: { backgroundColor: "#ef444420" },
  disableBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#ef4444" },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  noteText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, flex: 1 },
});
