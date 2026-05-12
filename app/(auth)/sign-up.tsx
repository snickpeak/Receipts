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
import { useTranslation } from "@/hooks/useTranslation";

const GUEST_KEY = "receipts_guest_mode_v1";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const { startSSOFlow } = useSSO();
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

  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
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
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState("");

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

  const handleSubmit = async () => {
    setLoading(true);
    setEmailError("");
    setPasswordError("");
    try {
      const { error } = await signUp.password({ emailAddress: email, password });
      if (error) {
        const msg = error.message ?? "Sign up failed. Please try again.";
        if (error.code?.includes("email")) setEmailError(msg);
        else if (error.code?.includes("password")) setPasswordError(msg);
        else setEmailError(msg);
        return;
      }
      await signUp.verifications.sendEmailCode();
    } catch (err: any) {
      setEmailError(err?.errors?.[0]?.message ?? err?.message ?? "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setCodeError("");
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code: verifyCode });
      if (error) { setCodeError(error.message ?? "Invalid code. Please try again."); return; }
      if (signUp.status === "complete") {
        await signUp.finalize({ navigate: () => router.replace("/(tabs)" as any) });
      }
    } catch (err: any) {
      setCodeError(err?.errors?.[0]?.message ?? "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
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
      // Web: use SignIn OAuth (Clerk supports new users here; signUp.authenticateWithRedirect can no-op in Expo web).
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
      else setOauthError("Could not start Google sign-in. Check the dev console and Clerk redirect URLs.");
    } catch (err: any) {
      const msg: string = err?.errors?.[0]?.message ?? err?.message ?? "";
      if (msg.toLowerCase().includes("already signed in") || msg.toLowerCase().includes("single session")) {
        router.replace("/(tabs)" as any);
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
      else setOauthError("Could not start Apple sign-in. Check Clerk redirect URLs.");
    } catch (err: any) {
      const msg: string = err?.errors?.[0]?.message ?? err?.message ?? "";
      if (msg.toLowerCase().includes("already signed in") || msg.toLowerCase().includes("single session")) {
        router.replace("/(tabs)" as any);
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

  const isLoading = loading || fetchStatus === "fetching" || oauthLoading;

  if (signUp.status === "missing_requirements" && signUp.unverifiedFields.includes("email_address") && signUp.missingFields.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg, paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]}>
        <LinearGradient colors={["#a855f730", "transparent"]} style={styles.logoWrap}>
          <Feather name="mail" size={30} color="#a855f7" />
        </LinearGradient>
        <Text style={[styles.title, { color: c.text }]}>Check your email</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>We sent a 6-digit code to {email}</Text>
        <TextInput
          style={[styles.input, styles.codeInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.inputText }]}
          value={verifyCode}
          onChangeText={setVerifyCode}
          placeholder="000000"
          placeholderTextColor={c.placeholder}
          keyboardType="numeric"
          maxLength={6}
          textAlign="center"
          autoFocus
        />
        {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}
        <Pressable style={[styles.primaryBtn, { opacity: verifyCode.length < 6 || loading ? 0.5 : 1 }]} onPress={handleVerify} disabled={verifyCode.length < 6 || loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify email</Text>}
        </Pressable>
        <Pressable onPress={() => signUp.verifications.sendEmailCode()} style={styles.textLink}>
          <Text style={[styles.textLinkText, { color: c.textMuted }]}>Resend code</Text>
        </Pressable>
        <View nativeID="clerk-captcha" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AuthGlowBackground isDark={isDark} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={logoAnimStyle}>
            <LinearGradient colors={["#a855f730", "transparent"]} style={styles.logoWrap}>
              <Feather name="layers" size={34} color="#a855f7" />
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.brand, { color: c.textFaint }]}>RECEIPTS</Text>
          <Text style={[styles.title, { color: c.text }]}>{t.auth.signUp}</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>Start saving your life's receipts</Text>

        <View style={styles.oauthRow}>
          <Pressable
            style={({ pressed }) => [styles.oauthBtn, pressed && styles.btnPressed, oauthLoading && { opacity: 0.5 }]}
            onPress={handleGoogleSSO}
            disabled={oauthLoading}
          >
            <View style={styles.googleMark}><Text style={styles.googleG}>G</Text></View>
            <Text style={styles.oauthTextDark}>Google</Text>
          </Pressable>
          {(Platform.OS === "ios" || Platform.OS === "web") && (
            <Pressable
              style={({ pressed }) => [styles.oauthBtn, styles.appleBtn, pressed && styles.btnPressed, oauthLoading && { opacity: 0.5 }]}
              onPress={handleAppleSSO}
              disabled={oauthLoading}
            >
              <FontAwesome name="apple" size={20} color="#111" />
              <Text style={styles.oauthTextDark}>Apple</Text>
            </Pressable>
          )}
        </View>
        {oauthError ? <Text style={styles.errorText}>{oauthError}</Text> : null}

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: c.divider }]} />
          <Text style={[styles.dividerText, { color: c.textFaint }]}>or sign up with email</Text>
          <View style={[styles.divider, { backgroundColor: c.divider }]} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: c.textMuted }]}>{t.auth.email}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.inputText }]}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={c.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: c.textMuted }]}>{t.auth.password}</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.inputText }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={c.placeholder}
              secureTextEntry={!showPassword}
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={c.eyeIcon} />
            </Pressable>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { opacity: !email || !password || isLoading ? 0.5 : pressed ? 0.8 : 1 }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleSubmit(); }}
          disabled={!email || !password || isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t.auth.signUp}</Text>}
        </Pressable>

        <Pressable onPress={handleGuestPass} style={styles.textLink}>
          <Text style={[styles.textLinkText, { color: c.textMuted }]}>{t.auth.guestPreview}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: c.textMuted }]}>{t.auth.hasAccount} </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable><Text style={styles.footerLink}>{t.auth.signIn}</Text></Pressable>
          </Link>
        </View>

        <View nativeID="clerk-captcha" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", paddingHorizontal: 28, gap: 12 },
  logoWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  brand: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 3, marginTop: -4 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginTop: 8 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 8 },
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
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
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
});
