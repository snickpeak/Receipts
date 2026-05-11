import React, { useEffect } from "react";
import { StyleSheet, View, type ViewStyle, type StyleProp } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

type Props = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonLoader({ width = "100%", height = 16, borderRadius = 8, style }: Props) {
  const colors = useColors();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    return () => {
      cancelAnimation(shimmer);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.muted,
        },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return (
    <View style={[skeletonStyles.card, { backgroundColor: colors.muted, borderColor: colors.border }, style]}>
      <View style={skeletonStyles.topRow}>
        <SkeletonLoader width={60} height={10} borderRadius={5} />
        <SkeletonLoader width={50} height={10} borderRadius={5} />
      </View>
      <SkeletonLoader width="80%" height={18} borderRadius={6} />
      <SkeletonLoader width="95%" height={14} borderRadius={6} />
      <SkeletonLoader width="60%" height={14} borderRadius={6} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
