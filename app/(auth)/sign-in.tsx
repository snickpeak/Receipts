import { Feather, FontAwesome } from "@expo/vector-icons";
import { useAuth, useClerk, useSignIn, useSignUp, useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthGlowBackground } from "@/components/AuthGlowBackground";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  isBiometricAvailable,
  getBiometricType,
  getBiometricCredentials,
  saveBiometricCredentials,
  clearBiometricCredentials,
  promptBiometric,
  getBiometricLabel,
  getBiometricIcon,
} from "@/hooks/biometricSignIn";

const GUEST_KEY = "receipts_guest_mode_v1";

WebBrowser.maybeCompleteAuthSession();

type ForgotStep = "email" | "code" | "newPassword";

export default function SignInScreen() {
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const { signIn, errors, fetchStatus } = useSignIn();
  const [signInError, setSignInError] = useState("");
  const { signUp } = useSignUp();
  const { startSSOFlow } = useSSO();
  /** Web redirect OAuth lives on `clerk.client.signIn` (SignInResource). Hooks return SignInFuture (`.sso()`), not `.authenticateWithRedirect`. */
  const legacyWebSignIn =
    "client" in clerk && clerk.client ? clerk.client.signIn : undefined;
  const canStartOAuth =
    Platform.OS === "web"
      ? typeof legacyWebSignIn?.authenticateWithRedirect === "function"
      : !!signIn && !!signUp;
  const router = useRouter();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = settings.appearanceMode === "dark" || (settings.appearanceMode === "system" && colorScheme === "dark");
  const c = {
    bg: isDark ? "#080808" : "#f5f5f5",
    text: isDark ? "#f0f0f0" : "#111111",
    textMuted: isDark ? "#888" : "#555",
    textFaint: isDark ? "#555" : "#999",
    inputBg: isDark ? "#111" : "#ffffff",
    inputBorder: isDark ? "#222" : "#d4d4d4",
    inputText: isDark ? "#f0f0f0" : "#111111",
    placeholder: isDark ? "#444" : "#aaa",
    divider: isDark ? "#1e1e1e" : "#e0e0e0",
    eyeIcon: isDark ? "#666" : "#aaa",
    cardBg: isDark ? "#111" : "#ffffff",
    cardBorder: isDark ? "#222" : "#e5e5e5",
    overlayBg: isDark ? "rgba(0,0,0,0.82)" : "rgba(0,0,0,0.55)",
    promptBg: isDark ? "#111" : "#fff",
    promptBorder: isDark ? "#222" : "#e5e5e5",
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState("");

  const [forgotStep, setForgotStep] = useState<ForgotStep | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  const [needsMFA, setNeedsMFA] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<"totp" | "sms">("totp");
  const [smsStep, setSmsStep] = useState<"send" | "code">("send");
  const [smsCode, setSmsCode] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsError, setSmsError] = useState("");

  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [biometricAvail, setBiometricAvail] = useState(false);
  const [biometricType, setBiometricType] = useState<"face" | "fingerprint" | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showEnablePrompt, setShowEnablePrompt] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");

  useEffect(() => {
    async function initBiometric() {
      const available = await isBiometricAvailable();
      setBiometricAvail(available);
      if (available) {
        const type = await getBiometricType();
        setBiometricType(type);
        const creds = await getBiometricCredentials();
        if (creds) setStoredEmail(creds.email);
      }
    }
    initBiometric();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);

  const logoScale = useSharedValue(1);
  useEffect(() => {
    logoScale.value = withRepeat(
      withTiming(1.07, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);
  const logoAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }] }));

  const finalize = useCallback(async () => {
    try {
      await signIn.finalize({});
      router.replace("/(tabs)" as any);
    } catch (err: any) {
      setSignInError(err?.errors?.[0]?.message ?? err?.message ?? "Sign in failed. Please try again.");
    }
  }, [signIn, router]);

  const handleEmailSignIn = async () => {
    if (!email || !password) return;
    setSignInError("");
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) { setSignInError(error.message ?? "Sign in failed. Please try again."); return; }
    if (signIn.status === "needs_second_factor") {
      setNeedsMFA(true);
    } else {
      if (biometricAvail && !storedEmail) {
        setPendingEmail(email);
        setPendingPassword(password);
        setShowEnablePrompt(true);
      } else {
        await finalize();
      }
    }
  };

  const handleBiometricSignIn = async () => {
    if (!storedEmail) return;
    setBiometricLoading(true);
    try {
      const ok = await promptBiometric(`Sign in as ${storedEmail}`);
      if (!ok) return;
      const creds = await getBiometricCredentials();
      if (!creds) { setStoredEmail(null); return; }
      const { error } = await signIn.password({ emailAddress: creds.email, password: creds.password });
      if (error) {
        await clearBiometricCredentials();
        setStoredEmail(null);
        setEmail(creds.email);
        return;
      }
      if (signIn.status === "needs_second_factor") {
        setNeedsMFA(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await finalize();
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleEnableBiometric = async () => {
    await saveBiometricCredentials({ email: pendingEmail, password: pendingPassword });
    setStoredEmail(pendingEmail);
    setShowEnablePrompt(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await finalize();
  };

  const handleSkipBiometric = async () => {
    setShowEnablePrompt(false);
    await finalize();
  };

  const handleForgetAccount = async () => {
    await clearBiometricCredentials();
    setStoredEmail(null);
  };

  const handleVerifyTOTP = async () => {
    if (totpCode.length < 6) return;
    setTotpLoading(true);
    setTotpError("");
    try {
      const { error } = await signIn.mfa.verifyTOTP({ code: totpCode });
      if (error) { setTotpError(error.message ?? "Invalid code. Try again."); return; }
      if (signIn.status === "complete") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await finalize();
      }
    } catch (err: any) {
      setTotpError(err?.errors?.[0]?.message ?? "Invalid code. Try again.");
    } finally {
      setTotpLoading(false);
    }
  };

  const handleVerifyBackupCode = async () => {
    if (!backupCode) return;
    setTotpLoading(true);
    setTotpError("");
    try {
      const { error } = await signIn.mfa.verifyBackupCode({ code: backupCode });
      if (error) { setTotpError(error.message ?? "Invalid backup code."); return; }
      if (signIn.status === "complete") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await finalize();
      }
    } catch (err: any) {
      setTotpError(err?.errors?.[0]?.message ?? "Invalid backup code.");
    } finally {
      setTotpLoading(false);
    }
  };

  const handleSendSMSCode = async () => {
    setSmsSending(true);
    setSmsError("");
    try {
      const { error } = await signIn.mfa.sendPhoneCode();
      if (error) { setSmsError(error.message ?? "Could not send SMS code."); return; }
      setSmsStep("code");
    } catch (err: any) {
      setSmsError(err?.errors?.[0]?.message ?? "Could not send SMS code. Please try again.");
    } finally {
      setSmsSending(false);
    }
  };

  const handleVerifySMSCode = async () => {
    if (!smsCode) return;
    setSmsSending(true);
    setSmsError("");
    try {
      const { error } = await signIn.mfa.verifyPhoneCode({ code: smsCode });
      if (error) { setSmsError(error.message ?? "Invalid code. Try again."); return; }
      if (signIn.status === "complete") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await finalize();
      }
    } catch (err: any) {
      setSmsError(err?.errors?.[0]?.message ?? "Invalid code. Try again.");
    } finally {
      setSmsSending(false);
    }
  };

  const handleVerify = async () => {
    const { error } = await signIn.mfa.verifyEmailCode({ code: verifyCode });
    if (error) { setSignInError(error.message ?? "Invalid code."); return; }
    if (signIn.status === "complete") await finalize();
  };

  const handleGoogleSSO = useCallback(async () => {
    if (isSignedIn) { router.replace("/(tabs)" as any); return; }
    if (!canStartOAuth) {
      setOauthError(
        "Clerk has not finished loading the auth client. Hard-refresh this page and confirm EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env matches this Clerk application.",
      );
      return;
    }
    setOauthError("");
    setOauthLoading(true);
    try {
      // Web: full-page redirect. Use absolute URLs so Clerk always matches the current origin (e.g. localhost:8081).
      if (Platform.OS === "web") {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const clientSignIn = "client" in clerk && clerk.client ? clerk.client.signIn : undefined;
        if (!clientSignIn?.authenticateWithRedirect) {
          setOauthError("OAuth redirect is not available. Update @clerk/expo or use Clerk hosted sign-in.");
          return;
        }
        await clientSignIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: `${origin}/oauth-native-callback`,
          redirectUrlComplete: "/(tabs)",
        });
        return;
      }
      const redirectUrl = AuthSession.makeRedirectUri({ scheme: "receiptsapp", path: "oauth-native-callback" });
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: "oauth_google", redirectUrl });
      if (createdSessionId) await setActive!({ session: createdSessionId, navigate: async () => router.replace("/(tabs)" as any) });
      else setOauthError("Could not open Google sign-in. Allow popups, or check Clerk redirect URLs include your dev URL.");
    } catch (err: any) {
      const msg: string = err?.errors?.[0]?.message ?? err?.message ?? String(err?.code ?? "");
      if (msg.toLowerCase().includes("already signed in") || msg.toLowerCase().includes("single session")) {
        router.replace("/(tabs)" as any);
      } else if (msg.toLowerCase().includes("popup") || msg.includes("ERR_WEB_BROWSER_BLOCKED")) {
        setOauthError("Pop-up was blocked. Allow pop-ups for this site, then try again.");
      } else if (msg) {
        setOauthError(msg);
      } else {
        setOauthError("Google sign-in failed. Try again or use email.");
      }
    } finally {
      setOauthLoading(false);
    }
  }, [canStartOAuth, clerk, startSSOFlow, isSignedIn, router, signIn]);

  const handleAppleSSO = useCallback(async () => {
    if (isSignedIn) { router.replace("/(tabs)" as any); return; }
    if (!canStartOAuth) {
      setOauthError(
        "Clerk has not finished loading the auth client. Hard-refresh this page and confirm EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env matches this Clerk application.",
      );
      return;
    }
    setOauthError("");
    setOauthLoading(true);
    try {
      if (Platform.OS === "web") {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const clientSignIn = "client" in clerk && clerk.client ? clerk.client.signIn : undefined;
        if (!clientSignIn?.authenticateWithRedirect) {
          setOauthError("OAuth redirect is not available. Update @clerk/expo or use Clerk hosted sign-in.");
          return;
        }
        await clientSignIn.authenticateWithRedirect({
          strategy: "oauth_apple",
          redirectUrl: `${origin}/oauth-native-callback`,
          redirectUrlComplete: "/(tabs)",
        });
        return;
      }
      const redirectUrl = AuthSession.makeRedirectUri({ scheme: "receiptsapp", path: "oauth-native-callback" });
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: "oauth_apple", redirectUrl });
      if (createdSessionId) await setActive!({ session: createdSessionId, navigate: async () => router.replace("/(tabs)" as any) });
      else setOauthError("Could not open Apple sign-in. Allow popups, or check Clerk redirect URLs.");
    } catch (err: any) {
      const msg: string = err?.errors?.[0]?.message ?? err?.message ?? String(err?.code ?? "");
      if (msg.toLowerCase().includes("already signed in") || msg.toLowerCase().includes("single session")) {
        router.replace("/(tabs)" as any);
      } else if (msg.toLowerCase().includes("popup") || msg.includes("ERR_WEB_BROWSER_BLOCKED")) {
        setOauthError("Pop-up was blocked. Allow pop-ups for this site, then try again.");
      } else if (msg) {
        setOauthError(msg);
      } else {
        setOauthError("Apple sign-in failed. Try again or use email.");
      }
    } finally {
      setOauthLoading(false);
    }
  }, [canStartOAuth, clerk, startSSOFlow, isSignedIn, router, signIn]);

  const handleGuestPass = async () => {
    await AsyncStorage.setItem(GUEST_KEY, "true");
    router.replace("/(tabs)" as any);
  };

  const openForgotPassword = () => {
    setResetEmail(email);
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError("");
    setForgotStep("email");
    Haptics.selectionAsync();
  };

  const handleSendResetCode = async () => {
    if (!resetEmail) return;
    setForgotLoading(true);
    setForgotError("");
    try {
      const { error: createError } = await signIn.create({ identifier: resetEmail });
      if (createError) {
        setForgotError(createError.message ?? "Account not found. Please check your email.");
        return;
      }
      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        setForgotError(sendError.message ?? "Could not send reset code. Please try again.");
        return;
      }
      setForgotStep("code");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setForgotError(err?.errors?.[0]?.message ?? err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyResetCode = async () => {
    if (resetCode.length < 6) return;
    setForgotLoading(true);
    setForgotError("");
    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code: resetCode });
      if (error) {
        setForgotError(error.message ?? "Invalid code. Please try again.");
        return;
      }
      setForgotStep("newPassword");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setForgotError(err?.errors?.[0]?.message ?? err?.message ?? "Invalid code. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) return;
    setForgotLoading(true);
    setForgotError("");
    try {
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
        signOutOfOtherSessions: true,
      });
      if (error) {
        setForgotError(error.message ?? "Could not reset password. Please try again.");
        return;
      }
      if (signIn.status === "complete") {
        await clearBiometricCredentials();
        setStoredEmail(null);
        await finalize();
      }
    } catch (err: any) {
      setForgotError(err?.errors?.[0]?.message ?? err?.message ?? "Could not reset password. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const biometricLabel = getBiometricLabel(biometricType);
  const biometricIcon = getBiometricIcon(biometricType);
  const isLoading = fetchStatus === "fetching" || oauthLoading;
  const showApple = Platform.OS === "ios" || Platform.OS === "web";
  const sharedPadding = { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 };

  if (needsMFA) {
    const factors = signIn.supportedSecondFactors ?? [];
    const hasTOTP = factors.some((f) => f.strategy === "totp");
    const hasSMS = factors.some((f) => f.strategy === "phone_code");
    const smsPhone = (factors.find((f) => f.strategy === "phone_code") as any)?.safeIdentifier as string | undefined;
    const showTabs = hasTOTP && hasSMS && !useBackupCode;

    const switchMethod = (method: "totp" | "sms") => {
      setMfaMethod(method);
      setSmsStep("send");
      setSmsCode("");
      setSmsError("");
      setTotpCode("");
      setTotpError("");
      setUseBackupCode(false);
    };

    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.container, { backgroundColor: c.bg, ...sharedPadding }]}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient colors={["#a855f730", "transparent"]} style={styles.logoWrap}>
            <Feather name="shield" size={30} color="#a855f7" />
          </LinearGradient>
          <Text style={[styles.brand, { color: c.textFaint }]}>RECEIPTS</Text>
          <Text style={[styles.title, { color: c.text }]}>Two-Factor Auth</Text>

          {/* Method selector tabs — shown only when both are available */}
          {showTabs && (
            <View style={[styles.mfaTabs, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
              <Pressable
                style={[styles.mfaTab, mfaMethod === "totp" && styles.mfaTabActive]}
                onPress={() => switchMethod("totp")}
              >
                <Feather name="shield" size={13} color={mfaMethod === "totp" ? "#a855f7" : c.textMuted} />
                <Text style={[styles.mfaTabText, { color: mfaMethod === "totp" ? "#a855f7" : c.textMuted }]}>
                  Authenticator
                </Text>
              </Pressable>
              <Pressable
                style={[styles.mfaTab, mfaMethod === "sms" && styles.mfaTabActive]}
                onPress={() => switchMethod("sms")}
              >
                <Feather name="message-square" size={13} color={mfaMethod === "sms" ? "#a855f7" : c.textMuted} />
                <Text style={[styles.mfaTabText, { color: mfaMethod === "sms" ? "#a855f7" : c.textMuted }]}>
                  Text Message
                </Text>
              </Pressable>
            </View>
          )}

          {/* TOTP method */}
          {(mfaMethod === "totp" || !hasSMS) && !useBackupCode && (
            <>
              <Text style={[styles.subtitle, { color: c.textMuted }]}>
                Open your authenticator app and enter the 6-digit code.
              </Text>
              <TextInput
                style={[styles.input, styles.codeInput, { backgroundColor: c.inputBg, borderColor: totpError ? "#ef4444" : c.inputBorder, color: c.inputText }]}
                value={totpCode}
                onChangeText={(t) => { setTotpCode(t.replace(/\D/g, "").slice(0, 6)); setTotpError(""); }}
                placeholder="000000"
                placeholderTextColor={c.placeholder}
                keyboardType="numeric"
                maxLength={6}
                textAlign="center"
                autoFocus={mfaMethod === "totp"}
              />
              {totpError ? <Text style={styles.errorText}>{totpError}</Text> : null}
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, { opacity: totpCode.length < 6 || totpLoading ? 0.5 : pressed ? 0.8 : 1 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleVerifyTOTP(); }}
                disabled={totpCode.length < 6 || totpLoading}
              >
                {totpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify</Text>}
              </Pressable>
              <Pressable onPress={() => { setUseBackupCode(true); setTotpError(""); }} style={styles.textLink}>
                <Text style={[styles.textLinkText, { color: c.textMuted }]}>Use a backup code instead</Text>
              </Pressable>
            </>
          )}

          {/* SMS method */}
          {mfaMethod === "sms" && hasSMS && !useBackupCode && (
            <>
              {smsStep === "send" ? (
                <>
                  <Text style={[styles.subtitle, { color: c.textMuted }]}>
                    {smsPhone
                      ? `We'll send a verification code to ${smsPhone}.`
                      : "We'll send a verification code to your phone."}
                  </Text>
                  {smsError ? <Text style={styles.errorText}>{smsError}</Text> : null}
                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, { opacity: smsSending ? 0.5 : pressed ? 0.8 : 1 }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleSendSMSCode(); }}
                    disabled={smsSending}
                  >
                    {smsSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send code via SMS</Text>}
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={[styles.subtitle, { color: c.textMuted }]}>
                    Enter the 6-digit code sent{smsPhone ? ` to ${smsPhone}` : " to your phone"}.
                  </Text>
                  <TextInput
                    style={[styles.input, styles.codeInput, { backgroundColor: c.inputBg, borderColor: smsError ? "#ef4444" : c.inputBorder, color: c.inputText }]}
                    value={smsCode}
                    onChangeText={(t) => { setSmsCode(t.replace(/\D/g, "").slice(0, 6)); setSmsError(""); }}
                    placeholder="000000"
                    placeholderTextColor={c.placeholder}
                    keyboardType="numeric"
                    maxLength={6}
                    textAlign="center"
                    autoFocus
                  />
                  {smsError ? <Text style={styles.errorText}>{smsError}</Text> : null}
                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, { opacity: smsCode.length < 6 || smsSending ? 0.5 : pressed ? 0.8 : 1 }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleVerifySMSCode(); }}
                    disabled={smsCode.length < 6 || smsSending}
                  >
                    {smsSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify</Text>}
                  </Pressable>
                  <Pressable onPress={() => { setSmsStep("send"); setSmsCode(""); setSmsError(""); }} style={styles.textLink}>
                    <Text style={[styles.textLinkText, { color: c.textMuted }]}>Resend code</Text>
                  </Pressable>
                </>
              )}
              <Pressable onPress={() => { setUseBackupCode(true); setSmsError(""); }} style={styles.textLink}>
                <Text style={[styles.textLinkText, { color: c.textMuted }]}>Use a backup code instead</Text>
              </Pressable>
            </>
          )}

          {/* Backup code method */}
          {useBackupCode && (
            <>
              <Text style={[styles.subtitle, { color: c.textMuted }]}>
                Enter one of your saved backup codes.
              </Text>
              <View style={styles.fieldGroup}>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, borderColor: totpError ? "#ef4444" : c.inputBorder, color: c.inputText }]}
                  value={backupCode}
                  onChangeText={(t) => { setBackupCode(t.toUpperCase()); setTotpError(""); }}
                  placeholder="XXXXXXXX"
                  placeholderTextColor={c.placeholder}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoFocus
                />
              </View>
              {totpError ? <Text style={styles.errorText}>{totpError}</Text> : null}
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, { opacity: !backupCode || totpLoading ? 0.5 : pressed ? 0.8 : 1 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleVerifyBackupCode(); }}
                disabled={!backupCode || totpLoading}
              >
                {totpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify Backup Code</Text>}
              </Pressable>
              <Pressable
                onPress={() => { setUseBackupCode(false); setTotpError(""); setBackupCode(""); }}
                style={styles.textLink}
              >
                <Text style={[styles.textLinkText, { color: c.textMuted }]}>
                  ← {hasTOTP ? "Use authenticator app" : hasSMS ? "Use SMS instead" : "Go back"}
                </Text>
              </Pressable>
            </>
          )}

          <Pressable onPress={() => signIn.reset()} style={styles.textLink}>
            <Text style={[styles.textLinkText, { color: c.textFaint }]}>← Sign in with a different account</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (signIn.status === "needs_client_trust") {
    return (
      <View style={[styles.container, { backgroundColor: c.bg, ...sharedPadding }]}>
        <Text style={[styles.brand, { color: c.textFaint }]}>RECEIPTS</Text>
        <Text style={[styles.title, { color: c.text }]}>Verify your identity</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>Enter the verification code sent to your email</Text>
        <TextInput
          style={[styles.input, styles.codeInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.inputText }]}
          value={verifyCode}
          onChangeText={setVerifyCode}
          placeholder="000000"
          placeholderTextColor={c.placeholder}
          keyboardType="numeric"
          textAlign="center"
        />
        {signInError ? <Text style={styles.errorText}>{signInError}</Text> : null}
        <Pressable style={[styles.primaryBtn, { opacity: isLoading ? 0.5 : 1 }]} onPress={handleVerify} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify</Text>}
        </Pressable>
        <Pressable onPress={() => signIn.mfa.sendEmailCode()} style={styles.textLink}>
          <Text style={[styles.textLinkText, { color: c.textMuted }]}>Resend code</Text>
        </Pressable>
        <Pressable onPress={() => signIn.reset()} style={styles.textLink}>
          <Text style={[styles.textLinkText, { color: c.textMuted }]}>← Start over</Text>
        </Pressable>
      </View>
    );
  }

  if (forgotStep === "email") {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.bg, ...sharedPadding }]} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={["#a855f730", "transparent"]} style={styles.logoWrap}>
            <Feather name="lock" size={30} color="#a855f7" />
          </LinearGradient>
          <Text style={[styles.brand, { color: c.textFaint }]}>RECEIPTS</Text>
          <Text style={[styles.title, { color: c.text }]}>Reset password</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>Enter your account email and we'll send you a reset code.</Text>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: c.textMuted }]}>Email address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.inputText }]}
              value={resetEmail}
              onChangeText={setResetEmail}
              placeholder="you@example.com"
              placeholderTextColor={c.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>
          {forgotError ? <Text style={styles.errorText}>{forgotError}</Text> : null}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: !resetEmail || forgotLoading ? 0.5 : pressed ? 0.8 : 1 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleSendResetCode(); }}
            disabled={!resetEmail || forgotLoading}
          >
            {forgotLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send reset code</Text>}
          </Pressable>
          <Pressable onPress={() => setForgotStep(null)} style={styles.textLink}>
            <Text style={[styles.textLinkText, { color: c.textMuted }]}>← Back to sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (forgotStep === "code") {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.bg, ...sharedPadding }]} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={["#a855f730", "transparent"]} style={styles.logoWrap}>
            <Feather name="mail" size={30} color="#a855f7" />
          </LinearGradient>
          <Text style={[styles.brand, { color: c.textFaint }]}>RECEIPTS</Text>
          <Text style={[styles.title, { color: c.text }]}>Check your email</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>
            We sent a 6-digit code to{"\n"}<Text style={{ color: "#a855f7" }}>{resetEmail}</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.codeInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.inputText }]}
            value={resetCode}
            onChangeText={setResetCode}
            placeholder="000000"
            placeholderTextColor={c.placeholder}
            keyboardType="numeric"
            maxLength={6}
            textAlign="center"
            autoFocus
          />
          {forgotError ? <Text style={styles.errorText}>{forgotError}</Text> : null}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: resetCode.length < 6 || forgotLoading ? 0.5 : pressed ? 0.8 : 1 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleVerifyResetCode(); }}
            disabled={resetCode.length < 6 || forgotLoading}
          >
            {forgotLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify code</Text>}
          </Pressable>
          <Pressable onPress={handleSendResetCode} style={styles.textLink}>
            <Text style={[styles.textLinkText, { color: c.textMuted }]}>Resend code</Text>
          </Pressable>
          <Pressable onPress={() => setForgotStep("email")} style={styles.textLink}>
            <Text style={[styles.textLinkText, { color: c.textMuted }]}>← Change email</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (forgotStep === "newPassword") {
    const passwordsMatch = newPassword === confirmPassword;
    const canSubmit = newPassword.length >= 8 && confirmPassword.length > 0 && passwordsMatch && !forgotLoading;
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.bg, ...sharedPadding }]} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={["#a855f730", "transparent"]} style={styles.logoWrap}>
            <Feather name="shield" size={30} color="#a855f7" />
          </LinearGradient>
          <Text style={[styles.brand, { color: c.textFaint }]}>RECEIPTS</Text>
          <Text style={[styles.title, { color: c.text }]}>New password</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>Choose a new password. Must be at least 8 characters.</Text>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: c.textMuted }]}>New password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.inputText }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={c.placeholder}
                secureTextEntry={!showNewPassword}
                autoFocus
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowNewPassword((v) => !v)}>
                <Feather name={showNewPassword ? "eye-off" : "eye"} size={18} color={c.eyeIcon} />
              </Pressable>
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: c.textMuted }]}>Confirm password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput, { backgroundColor: c.inputBg, borderColor: confirmPassword.length > 0 && !passwordsMatch ? "#ef4444" : c.inputBorder, color: c.inputText }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat password"
                placeholderTextColor={c.placeholder}
                secureTextEntry={!showConfirmPassword}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowConfirmPassword((v) => !v)}>
                <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={18} color={c.eyeIcon} />
              </Pressable>
            </View>
            {confirmPassword.length > 0 && !passwordsMatch && <Text style={styles.errorText}>Passwords don't match</Text>}
          </View>
          {forgotError ? <Text style={styles.errorText}>{forgotError}</Text> : null}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: !canSubmit ? 0.5 : pressed ? 0.8 : 1 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleResetPassword(); }}
            disabled={!canSubmit}
          >
            {forgotLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Set new password</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AuthGlowBackground isDark={isDark} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.container, sharedPadding]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={logoAnimStyle}>
            <LinearGradient colors={["#a855f730", "transparent"]} style={styles.logoWrap}>
              <Feather name="layers" size={34} color="#a855f7" />
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.brand, { color: c.textFaint }]}>RECEIPTS</Text>
          <Text style={[styles.title, { color: c.text }]}>{t.auth.signIn}</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>Sign in to access your account</Text>

        {storedEmail && biometricAvail && (
          <>
            <Pressable
              style={({ pressed }) => [styles.biometricCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder, opacity: biometricLoading ? 0.7 : pressed ? 0.8 : 1 }]}
              onPress={handleBiometricSignIn}
              disabled={biometricLoading}
            >
              <LinearGradient colors={["#a855f722", "transparent"]} style={styles.biometricIconCircle}>
                <Feather name={biometricIcon} size={20} color="#a855f7" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.biometricCardTitle, { color: c.text }]}>Continue as</Text>
                <Text style={[styles.biometricCardEmail, { color: "#a855f7" }]} numberOfLines={1}>{storedEmail}</Text>
              </View>
              {biometricLoading
                ? <ActivityIndicator color="#a855f7" size="small" />
                : <View style={styles.biometricChevron}><Feather name="chevron-right" size={18} color="#a855f7" /></View>}
            </Pressable>
            <Pressable onPress={handleForgetAccount} style={styles.textLink}>
              <Text style={[styles.textLinkText, { color: c.textFaint }]}>Sign in with a different account</Text>
            </Pressable>
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: c.divider }]} />
              <Text style={[styles.dividerText, { color: c.textFaint }]}>or sign in manually</Text>
              <View style={[styles.divider, { backgroundColor: c.divider }]} />
            </View>
          </>
        )}

        {!storedEmail && (
          <View style={styles.oauthRow}>
            <Pressable
              style={({ pressed }) => [
                styles.oauthBtn,
                pressed && styles.btnPressed,
                oauthLoading && { opacity: 0.55 },
              ]}
              onPress={handleGoogleSSO}
              disabled={oauthLoading}
            >
              <View style={styles.googleMark}><Text style={styles.googleG}>G</Text></View>
              <Text style={styles.oauthTextDark}>Google</Text>
            </Pressable>
            {showApple && (
              <Pressable
                style={({ pressed }) => [
                  styles.oauthBtn,
                  styles.appleBtn,
                  pressed && styles.btnPressed,
                  oauthLoading && { opacity: 0.55 },
                ]}
                onPress={handleAppleSSO}
                disabled={oauthLoading}
              >
                <FontAwesome name="apple" size={20} color="#111" />
                <Text style={styles.oauthTextDark}>Apple</Text>
              </Pressable>
            )}
          </View>
        )}
        {!storedEmail && oauthError ? <Text style={styles.errorText}>{oauthError}</Text> : null}

        {!storedEmail && (
          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: c.divider }]} />
            <Text style={[styles.dividerText, { color: c.textFaint }]}>or continue with email</Text>
            <View style={[styles.divider, { backgroundColor: c.divider }]} />
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: c.textMuted }]}>{t.auth.email}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.inputText }]}
            value={email}
            onChangeText={(v) => { setEmail(v); setSignInError(""); }}
            placeholder="you@example.com"
            placeholderTextColor={c.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: c.textMuted }]}>{t.auth.password}</Text>
            <Pressable onPress={openForgotPassword}>
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </Pressable>
          </View>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.inputText }]}
              value={password}
              onChangeText={(v) => { setPassword(v); setSignInError(""); }}
              placeholder="••••••••"
              placeholderTextColor={c.placeholder}
              secureTextEntry={!showPassword}
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={c.eyeIcon} />
            </Pressable>
          </View>
        </View>

        {signInError ? <Text style={styles.errorText}>{signInError}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { opacity: !email || !password || isLoading ? 0.5 : pressed ? 0.8 : 1, marginTop: signInError ? 4 : 16 }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleEmailSignIn(); }}
          disabled={!email || !password || isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t.auth.signIn}</Text>}
        </Pressable>

        <Pressable onPress={handleGuestPass} style={styles.textLink}>
          <Text style={[styles.textLinkText, { color: c.textMuted }]}>{t.auth.guestPreview}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: c.textMuted }]}>{t.auth.noAccount} </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable><Text style={styles.footerLink}>{t.auth.signUp}</Text></Pressable>
          </Link>
        </View>
      </ScrollView>

      {showEnablePrompt && (
        <View style={[StyleSheet.absoluteFill, styles.promptOverlay, { backgroundColor: c.overlayBg }]}>
          <View style={[styles.promptCard, { backgroundColor: c.promptBg, borderColor: c.promptBorder }]}>
            <LinearGradient colors={["#a855f730", "transparent"]} style={styles.promptIconCircle}>
              <Feather name={biometricIcon} size={32} color="#a855f7" />
            </LinearGradient>
            <Text style={[styles.promptTitle, { color: isDark ? "#f0f0f0" : "#111" }]}>
              Enable {biometricLabel}?
            </Text>
            <Text style={[styles.promptSub, { color: isDark ? "#888" : "#555" }]}>
              Sign in faster next time without typing your password.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, { width: "100%", opacity: pressed ? 0.8 : 1 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleEnableBiometric(); }}
            >
              <Text style={styles.primaryBtnText}>Enable {biometricLabel}</Text>
            </Pressable>
            <Pressable onPress={handleSkipBiometric} style={styles.textLink}>
              <Text style={[styles.textLinkText, { color: isDark ? "#888" : "#555" }]}>Not now</Text>
            </Pressable>
          </View>
        </View>
      )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", paddingHorizontal: 28, gap: 12 },
  logoWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  brand: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 3, marginTop: -4 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginTop: 8 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 8, textAlign: "center" },
  oauthRow: { flexDirection: "row", gap: 12, width: "100%", marginTop: 4 },
  oauthBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 14 },
  appleBtn: { backgroundColor: "#fff", borderColor: "#d1d5db" },
  googleMark: { width: 18, height: 18, alignItems: "center", justifyContent: "center" },
  googleG: { fontSize: 18, lineHeight: 18, fontFamily: "Inter_700Bold", color: "#4285F4" },
  oauthTextDark: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#111" },
  btnPressed: { opacity: 0.72 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, width: "100%" },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  fieldGroup: { width: "100%", gap: 8 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  forgotLink: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#a855f7" },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", width: "100%" },
  codeInput: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: 8, textAlign: "center" },
  passwordWrap: { position: "relative" },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },
  errorText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#ef4444" },
  primaryBtn: { width: "100%", backgroundColor: "#a855f7", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 4 },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  footer: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#a855f7" },
  textLink: { paddingVertical: 8 },
  textLinkText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  biometricCard: { width: "100%", flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 4 },
  biometricIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  biometricCardTitle: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 2 },
  biometricCardEmail: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  biometricChevron: { padding: 4 },
  promptOverlay: { alignItems: "center", justifyContent: "center", padding: 32 },
  promptCard: { width: "100%", borderRadius: 20, borderWidth: 1, padding: 28, alignItems: "center", gap: 12 },
  promptIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  promptTitle: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  promptSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 8 },
  mfaTabs: { flexDirection: "row", width: "100%", borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  mfaTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 8 },
  mfaTabActive: { backgroundColor: "#a855f720" },
  mfaTabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
