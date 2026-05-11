import React, { useCallback } from "react";
import { Pressable, type PressableProps, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

type Props = Omit<PressableProps, "onPress"> & {
  onPress?: () => void;
  haptic?: boolean;
  children: React.ReactNode;
};

export function AnimatedIconBounce({ onPress, haptic = true, children, ...rest }: Props) {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.7, { duration: 80 }),
      withSpring(1.25, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    if (haptic && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [onPress, haptic]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress} hitSlop={8} {...rest}>
      <Animated.View style={animStyle}>{children}</Animated.View>
    </Pressable>
  );
}
