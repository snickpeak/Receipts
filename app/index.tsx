import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { PressableScale } from "@/components/PressableScale";
import { HandwritingReceipts, HANDWRITING_DONE } from "@/components/HandwritingReceipts";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";

const INTRO_KEY = "receipts_intro_seen_v1";

const TAGLINES = [
  "Keep receipts on the life you're building.",
  "Life happens fast. Write it down.",
  "Your wins, your moments, your record.",
  "Document what matters. Keep what's real.",
  "Every moment worth keeping, saved.",
  "The private journal that keeps score.",
  "Save the moments that prove your story.",
  "Your story, your receipts, your proof.",
  "Write it down before it fades.",
  "Because moments are worth more when you keep them.",
];

function AnimatedContent({
  delay,
  children,
  style,
}: {
  delay: number;
  children: React.ReactNode;
  style?: object;
}) {
  const { settings } = useSettings();
  const rm = settings.reduceMotion;
  const opacity = useSharedValue(rm ? 1 : 0);
  const translateY = useSharedValue(rm ? 0 : 10);

  useEffect(() => {
    if (rm) return;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 400, reduceMotion: ReduceMotion.Never }),
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 14, stiffness: 160, reduceMotion: ReduceMotion.Never }),
    );
  }, [rm]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

function IntroOverlay({ onDone }: { onDone: () => void }) {
  const overlayOpacity = useSharedValue(1);
  const [mounted, setMounted] = useState(true);
  const doneCalled = useRef(false);

  const player = useVideoPlayer(
    require("../assets/videos/intro.mp4"),
    (p) => {
      p.loop = false;
      p.muted = false;
      p.play();
    },
  );

  const dismiss = useCallback(() => {
    if (doneCalled.current) return;
    doneCalled.current = true;
    AsyncStorage.setItem(INTRO_KEY, "true").catch(() => {});
    overlayOpacity.value = withTiming(0, { duration: 700 }, (finished) => {
      if (finished) runOnJS(setMounted)(false);
    });
    onDone();
  }, [overlayOpacity, onDone]);

  useEffect(() => {
    const sub = player.addListener("playToEnd", dismiss);
    const fallback = setTimeout(dismiss, 8000);
    return () => {
      sub.remove();
      clearTimeout(fallback);
    };
  }, [player, dismiss]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!mounted) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.introOverlay, animStyle]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
      />
    </Animated.View>
  );
}

export default function Index() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 24);
  const colors = useColors();

  const tagline = useMemo(
    () => TAGLINES[Math.floor(Math.random() * TAGLINES.length)],
    [],
  );

  const [introState, setIntroState] = useState<"checking" | "show" | "done">("checking");

  useEffect(() => {
    AsyncStorage.getItem(INTRO_KEY).then((val) => {
      setIntroState(val === "true" ? "done" : "show");
    }).catch(() => setIntroState("done"));
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topInset,
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <View style={{ flex: 1 }} />

      <AnimatedContent delay={0} style={styles.logoWrapOuter}>
        <LinearGradient
          accessible={false}
          colors={["#a855f730", "transparent"]}
          style={styles.logoWrap}
        >
          <Feather name="layers" size={34} color="#a855f7" accessible={false} />
        </LinearGradient>
      </AnimatedContent>

      <View style={styles.brandRow}>
        <HandwritingReceipts color={colors.foreground} />
      </View>

      <AnimatedContent delay={HANDWRITING_DONE} style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {tagline}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your private journal for moments, wins, and receipts worth keeping.
        </Text>
      </AnimatedContent>

      <AnimatedContent delay={HANDWRITING_DONE + 180} style={styles.btnBlock}>
        <PressableScale
          style={styles.primaryBtn}
          haptic="medium"
          onPress={() => router.replace("/(tabs)")}
          accessibilityRole="button"
          accessibilityLabel="Open app preview"
        >
          <Text
            style={[styles.primaryBtnText, { color: "#fff" }]}
            accessible={false}
          >
            Open preview
          </Text>
        </PressableScale>
        <PressableScale
          style={styles.secondaryBtn}
          scaleTo={0.96}
          onPress={() => router.replace("/(auth)/sign-in")}
          accessibilityRole="button"
          accessibilityLabel="Go to sign in"
        >
          <Text
            style={[styles.secondaryBtnText, { color: "#a855f7" }]}
            accessible={false}
          >
            Go to sign in
          </Text>
        </PressableScale>
      </AnimatedContent>

      <View style={{ flex: 1.45 }} />

      {introState === "show" && (
        <IntroOverlay onDone={() => setIntroState("done")} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 10,
  },
  logoWrapOuter: {
    marginBottom: 4,
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  brandRow: {
    width: "100%",
    marginBottom: 4,
  },
  textBlock: {
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.4,
    lineHeight: 29,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  btnBlock: {
    width: "100%",
    gap: 0,
    marginTop: 8,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#a855f7",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  secondaryBtn: {
    width: "100%",
    padding: 16,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  introOverlay: {
    backgroundColor: "#000",
    zIndex: 999,
  },
});
