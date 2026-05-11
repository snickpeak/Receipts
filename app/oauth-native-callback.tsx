import { useAuth, useClerk } from "@clerk/expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, useColorScheme, View } from "react-native";

/**
 * OAuth redirect target for Clerk SSO (see makeRedirectUri path in sign-in / sign-up).
 *
 * Web: `openAuthSessionAsync` normally finishes in a popup via `maybeCompleteAuthSession`.
 * If that throws (no `window.opener`) or returns non-success, we fall back to
 * `clerk.handleRedirectCallback` so full-page returns still complete — avoiding a blank/black screen.
 */
export default function OAuthNativeCallbackScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const clerk = useClerk();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";

  useEffect(() => {
    if (Platform.OS !== "web") return;

    let cancelled = false;

    try {
      const result = WebBrowser.maybeCompleteAuthSession();
      if (result.type === "success") {
        return;
      }
    } catch {
      // Popup flow cannot complete (e.g. missing opener) — try Clerk URL handler below.
    }

    void (async () => {
      try {
        await clerk.handleRedirectCallback(
          {
            signInUrl: "/(auth)/sign-in",
            signUpUrl: "/(auth)/sign-up",
          },
          (to) => {
            if (!cancelled) router.replace(to as any);
            return Promise.resolve();
          },
        );
      } catch {
        if (!cancelled) router.replace("/(auth)/sign-in" as any);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clerk, router]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!isLoaded) return;
    if (isSignedIn) router.replace("/(tabs)" as any);
    else router.replace("/(auth)/sign-in" as any);
  }, [isLoaded, isSignedIn, router]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#111" : "#f5f5f5" }]}>
      <Text style={[styles.title, { color: isDark ? "#f0f0f0" : "#111" }]}>Signing you in…</Text>
      {Platform.OS === "web" ? (
        <Text style={[styles.sub, { color: isDark ? "#888" : "#555" }]}>
          Completing Google sign-in. If nothing changes after a few seconds, go back to Sign in and try again (allow popups for this site).
        </Text>
      ) : null}
      <ActivityIndicator size="large" color="#a855f7" style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  sub: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
});
