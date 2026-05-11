import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  NotoSansEthiopic_400Regular,
  NotoSansEthiopic_500Medium,
  NotoSansEthiopic_600SemiBold,
  NotoSansEthiopic_700Bold,
} from "@expo-google-fonts/noto-sans-ethiopic";
import { ClerkLoaded, ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PhotoHeroProvider } from "@/context/PhotoHeroContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BiometricLock } from "@/components/BiometricLock";
import { EntriesProvider, useEntries } from "@/context/EntriesContext";
import { LockContext } from "@/context/LockContext";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";
import { getClerkPublishableKey, warnMissingNativeDomainOnce } from "@/lib/env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ScreenCapture from "expo-screen-capture";
import { Accelerometer } from "expo-sensors";
import * as Haptics from "expo-haptics";

SplashScreen.preventAutoHideAsync();

/**
 * Bridges Settings → EntriesContext so #1 E2E encryption uses the user's PIN
 * as the passphrase. The PIN never leaves the device.
 */
function EncryptionBridge() {
  const { settings, loaded } = useSettings();
  const { setEncryptionContext } = useEntries();
  useEffect(() => {
    if (!loaded) return;
    setEncryptionContext(
      settings.e2eEncryptionEnabled,
      settings.pin || settings.backupPassphrase,
      settings.encryptionSalt,
    );
  }, [loaded, settings.e2eEncryptionEnabled, settings.pin, settings.backupPassphrase, settings.encryptionSalt, setEncryptionContext]);
  return null;
}

/**
 * Bridges Settings → EntriesContext so the Local-only Mode toggle in Settings
 * actually controls whether cloud sync runs. Mirrors the EncryptionBridge pattern.
 */
function SyncBridge() {
  const { settings, loaded } = useSettings();
  const { setLocalOnlyMode } = useEntries();
  useEffect(() => {
    if (!loaded) return;
    setLocalOnlyMode(settings.localOnlyMode);
  }, [loaded, settings.localOnlyMode, setLocalOnlyMode]);
  return null;
}

const queryClient = new QueryClient();

const publishableKey = getClerkPublishableKey();
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL?.trim() || undefined;

function LockGate({ children }: { children: React.ReactNode }) {
  const { settings, loaded } = useSettings();
  const { clearLocalEntries } = useEntries();
  const [unlocked, setUnlocked] = useState(false);
  const [decoyMode, setDecoyMode] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [showPrivacyOverlay, setShowPrivacyOverlay] = useState(false);
  const backgroundedAt = useRef<number | null>(null);
  const guestKey = "receipts_guest_mode_v1";

  useEffect(() => {
    if (loaded && !settings.lockEnabled) setUnlocked(true);
  }, [loaded, settings.lockEnabled]);

  useEffect(() => {
    AsyncStorage.getItem(guestKey).then((value) => setGuestMode(value === "true"));
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        backgroundedAt.current = Date.now();
        if (settings.screenshotProtection) setShowPrivacyOverlay(true);
        if (guestMode) {
          void clearLocalEntries();
          void AsyncStorage.removeItem(guestKey);
        }
      } else if (nextState === "active") {
        setShowPrivacyOverlay(false);
        if (backgroundedAt.current !== null && unlocked && settings.lockEnabled) {
          const elapsedSeconds = (Date.now() - backgroundedAt.current) / 1000;
          const timeout = settings.autoLockTimeout;
          if (timeout !== -1 && elapsedSeconds >= timeout) {
            setUnlocked(false);
            setDecoyMode(false);
          }
        }
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, [clearLocalEntries, guestMode, unlocked, settings.lockEnabled, settings.autoLockTimeout, settings.screenshotProtection]);

  const lock = useCallback(() => {
    setUnlocked(false);
    setDecoyMode(false);
  }, []);

  // ── #2 Screenshot prevention (native only) ─────────────────────────────────
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (settings.screenshotProtection) {
      ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    } else {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    }
  }, [settings.screenshotProtection]);

  // ── #3 Panic gesture: shake to lock ────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === "web" || !settings.panicShakeEnabled || !unlocked) return;
    let lastShakeAt = 0;
    Accelerometer.setUpdateInterval(120);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      // 1g rest + spike. Threshold ≈ 2.4g works well for "vigorous shake".
      if (magnitude > 2.4) {
        const now = Date.now();
        if (now - lastShakeAt > 1500) {
          lastShakeAt = now;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          lock();
        }
      }
    });
    return () => sub.remove();
  }, [settings.panicShakeEnabled, unlocked, lock]);

  if (!loaded) return null;

  return (
    <LockContext.Provider value={{ lock, decoyMode }}>
      {settings.lockEnabled && !unlocked ? (
        <View style={StyleSheet.absoluteFill}>
          <BiometricLock
            onUnlock={() => { setDecoyMode(false); setUnlocked(true); }}
            onDecoyUnlock={() => { setDecoyMode(true); setUnlocked(true); }}
          />
        </View>
      ) : (
        <>
          {children}
          {showPrivacyOverlay && Platform.OS !== "web" && (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}
        </>
      )}
    </LockContext.Provider>
  );
}

function MissingClerkKeyScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0a", justifyContent: "center", padding: 24 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <Text style={{ color: "#f5f5f5", fontSize: 20, fontFamily: "Inter_600SemiBold", marginBottom: 12 }}>
          Clerk is not configured
        </Text>
        <Text style={{ color: "#a3a3a3", fontSize: 15, lineHeight: 22, fontFamily: "Inter_400Regular" }}>
          Create{" "}
          <Text style={{ color: "#c4b5fd" }}>artifacts/mobile/.env</Text> with a valid{" "}
          <Text style={{ color: "#c4b5fd" }}>EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY</Text> (pk_test_… or pk_live_… from
          the Clerk dashboard), then restart Expo.
        </Text>
      </ScrollView>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansEthiopic_400Regular,
    NotoSansEthiopic_500Medium,
    NotoSansEthiopic_600SemiBold,
    NotoSansEthiopic_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    warnMissingNativeDomainOnce();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  if (!publishableKey) {
    return <MissingClerkKeyScreen />;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} proxyUrl={proxyUrl}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <SettingsProvider>
                    <EntriesProvider>
                      <EncryptionBridge />
                      <SyncBridge />
                      <PhotoHeroProvider>
                      <LockGate>
                        <Stack
                          screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: "transparent" },
                            animation: "fade_from_bottom",
                            animationDuration: 250,
                          }}
                        >
                          <Stack.Screen name="(auth)" options={{ headerShown: false, animation: "fade" }} />
                          <Stack.Screen name="oauth-native-callback" options={{ headerShown: false, animation: "fade" }} />
                          <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "fade" }} />
                          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false, animation: "fade" }} />
                          <Stack.Screen name="add" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
                          <Stack.Screen name="entry/[id]" options={{ headerShown: false, animation: "ios_from_right", animationDuration: 300 }} />
                          <Stack.Screen name="settings" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
                          <Stack.Screen name="threads" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
                          <Stack.Screen name="places" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
                          <Stack.Screen name="digest" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
                          <Stack.Screen name="trash" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
                        </Stack>
                      </LockGate>
                      </PhotoHeroProvider>
                    </EntriesProvider>
                  </SettingsProvider>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </QueryClientProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
