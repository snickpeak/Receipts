import React, { useEffect } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSettings } from "@/context/SettingsContext";

interface Props {
  size?: number;
  accessible?: boolean;
}

export function AnimatedFireEmoji({ size = 16, accessible = false }: Props) {
  const { settings } = useSettings();
  const rm = settings.reduceMotion;

  const scaleY = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (rm) {
      cancelAnimation(scaleY);
      cancelAnimation(translateY);
      cancelAnimation(rotate);
      scaleY.value = withTiming(1, { duration: 200, reduceMotion: ReduceMotion.Never });
      translateY.value = withTiming(0, { duration: 200, reduceMotion: ReduceMotion.Never });
      rotate.value = withTiming(0, { duration: 200, reduceMotion: ReduceMotion.Never });
      return;
    }
    scaleY.value = 0.88;
    rotate.value = -7;
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
  }, [rm]);

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
