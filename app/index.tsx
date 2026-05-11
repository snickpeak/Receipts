import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { useColors } from "@/hooks/useColors";

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

const BRAND = "RECEIPTS";
const LETTER_DELAY = 110;
const LETTERS_DONE = BRAND.length * LETTER_DELAY + 200;

// Pre-computed per-letter organic offsets (stable across renders)
const LETTER_ROTATIONS = [-8, 6, -4, 9, -7, 5, -3, 8];
const LETTER_Y_OFFSETS = [14, 10, 16, 12, 18, 10, 14, 12];

function AnimatedLetter({
  char,
  index,
  color,
}: {
  char: string;
  index: number;
  color: string;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(LETTER_Y_OFFSETS[index] ?? 12);
  const scale = useSharedValue(0.3);
  const rotate = useSharedValue(LETTER_ROTATIONS[index] ?? 0);

  useEffect(() => {
    const d = index * LETTER_DELAY;
    opacity.value = withDelay(d, withTiming(1, { duration: 160 }));
    translateY.value = withDelay(d, withSpring(0, { damping: 10, stiffness: 180 }));
    scale.value = withDelay(d, withSpring(1, { damping: 9, stiffness: 200 }));
    rotate.value = withDelay(d, withSpring(0, { damping: 8, stiffness: 140 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.Text style={[styles.brandLetter, { color }, style]}>
      {char}
    </Animated.Text>
  );
}

function AnimatedContent({ delay, children, style }: { delay: number; children: React.ReactNode; style?: object }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 160 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

export default function Index() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 24);
  const colors = useColors();

  const tagline = useMemo(
    () => TAGLINES[Math.floor(Math.random() * TAGLINES.length)],
    [],
  );

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
      <AnimatedContent delay={0} style={styles.logoWrapOuter}>
        <LinearGradient
          accessible={false}
          colors={["#a855f730", "transparent"]}
          style={styles.logoWrap}
        >
          <Feather name="layers" size={34} color="#a855f7" accessible={false} />
        </LinearGradient>
      </AnimatedContent>

      {/* Handwritten letter-by-letter brand name */}
      <View
        style={styles.brandRow}
        accessible={true}
        accessibilityLabel="Receipts"
        accessibilityRole="header"
      >
        {BRAND.split("").map((char, i) => (
          <AnimatedLetter
            key={i}
            char={char}
            index={i}
            color={colors.foreground}
          />
        ))}
      </View>

      <AnimatedContent delay={LETTERS_DONE} style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {tagline}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your private journal for moments, wins, and receipts worth keeping.
        </Text>
      </AnimatedContent>

      <AnimatedContent delay={LETTERS_DONE + 180} style={styles.btnBlock}>
        <PressableScale
          style={styles.primaryBtn}
          haptic="medium"
          onPress={() => router.replace("/(tabs)")}
          accessibilityRole="button"
          accessibilityLabel="Open app preview"
        >
          <Text style={[styles.primaryBtnText, { color: "#fff" }]} accessible={false}>
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
          <Text style={[styles.secondaryBtnText, { color: "#a855f7" }]} accessible={false}>
            Go to sign in
          </Text>
        </PressableScale>
      </AnimatedContent>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 1,
    marginBottom: 4,
  },
  brandLetter: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: 5,
  },
  textBlock: {
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 33,
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
});
