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
import { useColors } from "@/hooks/useColors";

type Step = "loading" | "select" | "phone" | "verify" | "done";

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return phone.slice(0, -4).replace(/\d/g, "*") + phone.slice(-4);
}

export default function SetupSMSScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottom = Platform.OS === "web" ? 34 : insets.bottom;

  type PhoneResource = NonNullable<ReturnType<typeof useUser>["user"]>["phoneNumbers"][number];

  const [step, setStep] = useState<Step>("loading");
  const [verifiedPhones, setVerifiedPhones] = useState<PhoneResource[]>([]);
  const [phoneInput, setPhoneInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [pendingPhone, setPendingPhone] = useState<PhoneResource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const phones = (user.phoneNumbers ?? []).filter((p) => p.verification?.status === "verified");
    setVerifiedPhones(phones);
    setStep(phones.length > 0 ? "select" : "phone");
  }, [user]);

  const handleEnableExisting = async (phone: PhoneResource) => {
    setLoading(true);
    setError("");
    try {
      await phone.setReservedForSecondFactor({ reserved: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("done");
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Could not enable SMS 2FA. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhone = async () => {
    if (!user || !phoneInput.trim()) return;
    setLoading(true);
    setError("");
    try {
      const newPhone = await user.createPhoneNumber({ phoneNumber: phoneInput.trim() });
      await newPhone.prepareVerification();
      setPendingPhone(newPhone);
      setStep("verify");
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Could not add phone number. Check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!pendingPhone || otpCode.length < 6) return;
    setLoading(true);
    setError("");
    try {
      const verified = await pendingPhone.attemptVerification({ code: otpCode });
      await verified.setReservedForSecondFactor({ reserved: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("done");
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Invalid code. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const sharedContainer: any = {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingTop: top + 16,
    paddingBottom: bottom + 24,
    paddingHorizontal: 24,
    gap: 20,
  };

  if (step === "loading") {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color="#a855f7" size="large" />
      </View>
    );
  }

  if (step === "done") {
    return (
      <ScrollView contentContainerStyle={sharedContainer}>
        <LinearGradient colors={["#22c55e30", "transparent"]} style={styles.iconCircle}>
          <Feather name="check-circle" size={28} color="#22c55e" />
        </LinearGradient>
        <Text style={[styles.title, { color: colors.foreground }]}>SMS 2FA enabled!</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          You'll now receive a text message when signing in from a new device.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
        >
          <Text style={styles.primaryBtnText}>Done</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (step === "select") {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={sharedContainer} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.closeRow}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>

          <LinearGradient colors={["#a855f730", "transparent"]} style={styles.iconCircle}>
            <Feather name="message-square" size={28} color="#a855f7" />
          </LinearGradient>

          <Text style={[styles.title, { color: colors.foreground }]}>Set up SMS authentication</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Choose which phone number to use. A code will be sent via text message when you sign in.
          </Text>

          {verifiedPhones.map((phone) => {
            const isActive = phone.reservedForSecondFactor;
            return (
              <Pressable
                key={phone.id}
                style={({ pressed }) => [
                  styles.phoneCard,
                  {
                    backgroundColor: colors.muted,
                    borderColor: isActive ? "#22c55e" : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => !isActive && !loading && handleEnableExisting(phone)}
                disabled={isActive || loading}
              >
                <View style={styles.phoneCardLeft}>
                  <Feather
                    name={isActive ? "check-circle" : "smartphone"}
                    size={18}
                    color={isActive ? "#22c55e" : colors.mutedForeground}
                  />
                  <View>
                    <Text style={[styles.phoneNumber, { color: colors.foreground }]}>
                      {phone.phoneNumber}
                    </Text>
                    {isActive && (
                      <Text style={styles.activeLabel}>Currently active</Text>
                    )}
                  </View>
                </View>
                {!isActive && (
                  loading ? (
                    <ActivityIndicator size="small" color="#a855f7" />
                  ) : (
                    <Text style={styles.useBtn}>Use this</Text>
                  )
                )}
              </Pressable>
            );
          })}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable onPress={() => setStep("phone")} style={styles.textLink}>
            <Feather name="plus" size={14} color="#a855f7" />
            <Text style={styles.addPhoneText}>Add a different phone number</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === "phone") {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={sharedContainer} keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={() => (verifiedPhones.length > 0 ? setStep("select") : router.back())}
            style={styles.closeRow}
          >
            <Feather name="arrow-left" size={22} color={colors.mutedForeground} />
          </Pressable>

          <LinearGradient colors={["#a855f730", "transparent"]} style={styles.iconCircle}>
            <Feather name="phone" size={28} color="#a855f7" />
          </LinearGradient>

          <Text style={[styles.title, { color: colors.foreground }]}>Add phone number</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Enter your phone number in international format. We'll send a verification code via SMS.
          </Text>

          <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: error ? "#ef4444" : colors.border }]}>
            <Feather name="phone" size={16} color={colors.mutedForeground} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.input, { color: colors.foreground, flex: 1 }]}
              value={phoneInput}
              onChangeText={(t) => { setPhoneInput(t); setError(""); }}
              placeholder="+1 555 123 4567"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              autoFocus
            />
          </View>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Include country code, e.g. +1 for US/Canada, +44 for UK
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: !phoneInput.trim() || loading ? 0.5 : pressed ? 0.8 : 1 },
            ]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleAddPhone(); }}
            disabled={!phoneInput.trim() || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send verification code</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={sharedContainer} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setStep("phone")} style={styles.closeRow}>
          <Feather name="arrow-left" size={22} color={colors.mutedForeground} />
        </Pressable>

        <LinearGradient colors={["#a855f730", "transparent"]} style={styles.iconCircle}>
          <Feather name="message-circle" size={28} color="#a855f7" />
        </LinearGradient>

        <Text style={[styles.title, { color: colors.foreground }]}>Check your texts</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enter the 6-digit code we sent to{" "}
          <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>
            {pendingPhone?.phoneNumber ? maskPhone(pendingPhone.phoneNumber) : "your phone"}
          </Text>
          .
        </Text>

        <TextInput
          style={[
            styles.codeInput,
            {
              backgroundColor: colors.muted,
              borderColor: error ? "#ef4444" : colors.border,
              color: colors.foreground,
            },
          ]}
          value={otpCode}
          onChangeText={(t) => { setOtpCode(t.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          placeholder="000000"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numeric"
          maxLength={6}
          textAlign="center"
          autoFocus
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            { opacity: otpCode.length < 6 || loading ? 0.5 : pressed ? 0.8 : 1 },
          ]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleVerifyOTP(); }}
          disabled={otpCode.length < 6 || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify & Enable</Text>}
        </Pressable>

        <Pressable
          onPress={async () => {
            if (!pendingPhone) return;
            setLoading(true);
            try { await pendingPhone.prepareVerification(); } catch {}
            setLoading(false);
          }}
          style={styles.textLink}
        >
          <Text style={[styles.textLinkText, { color: colors.mutedForeground }]}>Resend code</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  closeRow: { alignSelf: "flex-start" },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -10 },
  phoneCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  phoneCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  phoneNumber: { fontSize: 15, fontFamily: "Inter_500Medium" },
  activeLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#22c55e", marginTop: 2 },
  useBtn: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#a855f7" },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#ef4444", textAlign: "center" },
  primaryBtn: { backgroundColor: "#a855f7", borderRadius: 12, padding: 16, alignItems: "center" },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  textLink: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", paddingVertical: 8 },
  textLinkText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  addPhoneText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#a855f7" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  input: { fontSize: 16, fontFamily: "Inter_400Regular" },
  codeInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: 10,
  },
});
