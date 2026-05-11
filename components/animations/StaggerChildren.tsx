import React from "react";
import { View, type ViewStyle, type StyleProp } from "react-native";
import { FadeInView } from "./FadeInView";

type Props = {
  children: React.ReactNode;
  staggerMs?: number;
  baseDelay?: number;
  from?: "bottom" | "top" | "left" | "right" | "none";
  distance?: number;
  style?: StyleProp<ViewStyle>;
  spring?: boolean;
};

export function StaggerChildren({
  children,
  staggerMs = 60,
  baseDelay = 0,
  from = "bottom",
  distance = 12,
  style,
  spring = true,
}: Props) {
  const items = React.Children.toArray(children);
  return (
    <View style={style}>
      {items.map((child, i) => (
        <FadeInView
          key={i}
          delay={baseDelay + i * staggerMs}
          from={from}
          distance={distance}
          spring={spring}
        >
          {child}
        </FadeInView>
      ))}
    </View>
  );
}
