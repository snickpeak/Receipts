import React, { useEffect } from "react";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { View, StyleSheet } from "react-native";

import { useSettings } from "@/context/SettingsContext";

const LETTERS = ["R", "E", "C", "E", "I", "P", "T", "S"];
const STAGGER = 80;
const LETTER_DUR = 350;
export const HANDWRITING_DONE = STAGGER * (LETTERS.length - 1) + LETTER_DUR + 200;

function AnimatedLetter({
  char,
  color,
  delay,
  reduceMotion,
}: {
  char: string;
  color: string;
  delay: number;
  reduceMotion: boolean;
}) {
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(reduceMotion ? 0 : 10);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: LETTER_DUR,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.Never,
      }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration: LETTER_DUR,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.Never,
      }),
    );
  }, [reduceMotion]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[styles.letter, { color }, animStyle]}>
      {char}
    </Animated.Text>
  );
}

export function HandwritingReceipts({ color }: { color: string }) {
  const { settings } = useSettings();
  const rm = settings.reduceMotion;

  return (
    <View
      accessible
      accessibilityLabel="RECEIPTS"
      accessibilityRole="header"
      style={styles.row}
    >
      {LETTERS.map((char, i) => (
        <AnimatedLetter
          key={i}
          char={char}
          color={color}
          delay={i * STAGGER}
          reduceMotion={rm}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  letter: {
    fontSize: 48,
    fontFamily: "Inter_400Regular",
    letterSpacing: 6,
    includeFontPadding: false,
  },
});
