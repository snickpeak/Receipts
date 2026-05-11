import React, { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
  size?: number;
  accessible?: boolean;
}

export function AnimatedFireEmoji({ size = 16, accessible = false }: Props) {
  const reducedMotion = useReducedMotion();

  const scaleY = useSharedValue(0.88);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(-7);

  useEffect(() => {
    if (reducedMotion) return;
    scaleY.value = withRepeat(
      withTiming(1.16, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    translateY.value = withRepeat(
      withTiming(-4, { duration: 540, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    rotate.value = withRepeat(
      withTiming(7, { duration: 950, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scaleY: scaleY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.Text
      style={[{ fontSize: size, lineHeight: size * 1.3 }, animStyle]}
      accessible={accessible}
    >
      🔥
    </Animated.Text>
  );
}
