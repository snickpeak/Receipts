import React, { useEffect } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useReducedMotion } from "@/hooks/useReducedMotion";

const MAX_STAGGER_INDEX = 15;

type Props = {
  index: number;
  children: React.ReactNode;
  delay?: number;
  staggerMs?: number;
};

export function AnimatedListItem({ index, children, delay = 0, staggerMs = 50 }: Props) {
  const reduceMotion = useReducedMotion();
  const clampedIndex = Math.min(index, MAX_STAGGER_INDEX);
  const shouldAnimate = index <= MAX_STAGGER_INDEX;
  const opacity = useSharedValue(shouldAnimate && !reduceMotion ? 0 : 1);
  const translateY = useSharedValue(shouldAnimate && !reduceMotion ? 18 : 0);

  useEffect(() => {
    if (!shouldAnimate || reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const d = delay + clampedIndex * staggerMs;
    opacity.value = withDelay(d, withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(d, withSpring(0, { damping: 20, stiffness: 180 }));
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values stable
  }, [shouldAnimate, reduceMotion, delay, clampedIndex, staggerMs]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
