import React, { useEffect } from "react";
import { type ViewStyle, type StyleProp } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";

import { useReducedMotion } from "@/hooks/useReducedMotion";

type Props = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  from?: "bottom" | "top" | "left" | "right" | "none";
  distance?: number;
  style?: StyleProp<ViewStyle>;
  spring?: boolean;
};

export function FadeInView({
  children,
  delay = 0,
  duration = 400,
  from = "bottom",
  distance = 20,
  style,
  spring = false,
}: Props) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const offset = useSharedValue(distance);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      offset.value = 0;
      return;
    }
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
    offset.value = spring
      ? withDelay(delay, withSpring(0, { damping: 18, stiffness: 160 }))
      : withDelay(delay, withTiming(0, { duration, easing: Easing.out(Easing.quad) }));
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(offset);
    };
  }, [delay, duration, spring, distance, reduceMotion, from]);

  const animStyle = useAnimatedStyle(() => {
    const transform: any[] = [];
    if (from === "bottom" || from === "top") {
      transform.push({ translateY: from === "top" ? -offset.value : offset.value });
    } else if (from === "left" || from === "right") {
      transform.push({ translateX: from === "left" ? -offset.value : offset.value });
    }
    return { opacity: opacity.value, transform };
  });

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}
