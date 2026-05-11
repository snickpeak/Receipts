import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface Props {
  isDark: boolean;
}

export function AuthGlowBackground({ isDark }: Props) {
  const op1 = useSharedValue(0.04);
  const op2 = useSharedValue(0.03);
  const op3 = useSharedValue(0.03);

  useEffect(() => {
    op1.value = withRepeat(
      withTiming(isDark ? 0.22 : 0.13, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    op2.value = withDelay(
      1400,
      withRepeat(
        withTiming(isDark ? 0.18 : 0.11, { duration: 4300, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    op3.value = withDelay(
      800,
      withRepeat(
        withTiming(isDark ? 0.20 : 0.12, { duration: 3100, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [isDark]);

  const style1 = useAnimatedStyle(() => ({ opacity: op1.value }));
  const style2 = useAnimatedStyle(() => ({ opacity: op2.value }));
  const style3 = useAnimatedStyle(() => ({ opacity: op3.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.orb, styles.orb1, style1]} />
      <Animated.View style={[styles.orb, styles.orb2, style2]} />
      <Animated.View style={[styles.orb, styles.orb3, style3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: "absolute",
    borderRadius: 9999,
  },
  orb1: {
    width: 340,
    height: 340,
    top: -100,
    left: -100,
    backgroundColor: "#a855f7",
  },
  orb2: {
    width: 260,
    height: 260,
    top: -50,
    right: -80,
    backgroundColor: "#6366f1",
  },
  orb3: {
    width: 300,
    height: 300,
    bottom: -100,
    left: 45,
    backgroundColor: "#c084fc",
  },
});
