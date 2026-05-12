import React, { useEffect } from "react";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface Props {
  size?: number;
  accessible?: boolean;
}

export function AnimatedFireEmoji({ size = 16, accessible = false }: Props) {
  const scaleY = useSharedValue(0.88);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(-7);

  useEffect(() => {
    scaleY.value = withRepeat(
      withTiming(1.16, { duration: 700, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.Never }),
      -1,
      true,
    );
    translateY.value = withRepeat(
      withTiming(-4, { duration: 540, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.Never }),
      -1,
      true,
    );
    rotate.value = withRepeat(
      withTiming(7, { duration: 950, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.Never }),
      -1,
      true,
    );
  }, []);

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
