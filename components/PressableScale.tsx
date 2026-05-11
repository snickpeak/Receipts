import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, type PressableProps, type ViewStyle, type StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useReducedMotion } from "@/hooks/useReducedMotion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  opacityTo?: number;
  /** Slightly snappier than timing-based scale (skipped when Reduce motion is on). */
  spring?: boolean;
  haptic?: "light" | "medium" | "selection" | false;
  disabled?: boolean;
};

export function PressableScale({
  style,
  scaleTo = 0.97,
  opacityTo = 0.85,
  spring = false,
  haptic = "light",
  disabled,
  onPressIn,
  onPress,
  children,
  ...rest
}: Props) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (reducedMotion) {
          opacity.value = withTiming(opacityTo, { duration: 70 });
        } else if (spring) {
          scale.value = withSpring(scaleTo, { damping: 17, stiffness: 380 });
          opacity.value = withTiming(opacityTo, { duration: 90, easing: Easing.out(Easing.quad) });
        } else {
          scale.value = withTiming(scaleTo, { duration: 90, easing: Easing.out(Easing.quad) });
          opacity.value = withTiming(opacityTo, { duration: 90, easing: Easing.out(Easing.quad) });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reducedMotion) {
          scale.value = spring
            ? withSpring(1, { damping: 14, stiffness: 220 })
            : withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) });
        } else {
          scale.value = 1;
        }
        opacity.value = withTiming(1, { duration: reducedMotion ? 80 : 160, easing: Easing.out(Easing.quad) });
        rest.onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic && !disabled && Platform.OS !== "web") {
          if (haptic === "selection") {
            Haptics.selectionAsync();
          } else {
            Haptics.impactAsync(
              haptic === "medium"
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light,
            );
          }
        }
        onPress?.(e);
      }}
      style={[animatedStyle, style]}
    >
      {children as React.ReactNode}
    </AnimatedPressable>
  );
}
