import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Switch, type SwitchProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Switch with light haptics + subtle spring when toggled (skipped when Reduce motion is on). */
export function SpringSwitch(props: SwitchProps) {
  const reduced = useReducedMotion();
  const burst = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: burst.value }],
  }));

  const { onValueChange, ...rest } = props;

  return (
    <Animated.View style={[style, { justifyContent: "center" }]}>
      <Switch
        {...rest}
        onValueChange={(v) => {
          if (Platform.OS !== "web") void Haptics.selectionAsync();
          if (!reduced) burst.value = withSequence(withTiming(1.045, { duration: 85 }), withSpring(1, { damping: 14, stiffness: 220 }));
          onValueChange?.(v);
        }}
      />
    </Animated.View>
  );
}
