import React, { useEffect } from "react";
import { type ViewStyle, type StyleProp } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

type Props = {
  children: React.ReactNode;
  duration?: number;
  minScale?: number;
  maxScale?: number;
  minOpacity?: number;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
};

export function PulseView({
  children,
  duration = 1400,
  minScale = 0.97,
  maxScale = 1.03,
  minOpacity = 0.7,
  style,
  active = true,
}: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      progress.value = withTiming(0, { duration: 200 });
    }
    return () => cancelAnimation(progress);
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 1], [minScale, maxScale]) },
    ],
    opacity: interpolate(progress.value, [0, 1], [minOpacity, 1]),
  }));

  return (
    <Animated.View style={[animStyle, style]}>{children}</Animated.View>
  );
}
