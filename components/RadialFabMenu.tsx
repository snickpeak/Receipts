import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Action = { key: string; label: string; icon: keyof typeof Feather.glyphMap; onPress: () => void };

const ACTIONS: Action[] = [
  { key: "note", label: "Note", icon: "edit-3", onPress: () => router.push("/add") },
  { key: "money", label: "Money", icon: "dollar-sign", onPress: () => router.push({ pathname: "/add", params: { tag: "Money" } } as any) },
];

/** Pixel fan from header + (top-right): down and left */
const OFFSETS_FROM_HEADER = [
  { x: -86, y: 56 },
  { x: -118, y: 102 },
];

type Props = {
  open: boolean;
  onClose: () => void;
  /** Absolute Y of the + control (top edge area). */
  topOffset: number;
  rightOffset?: number;
};

export function RadialFabMenu({ open, onClose, topOffset, rightOffset = 18 }: Props) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const backdrop = useSharedValue(0);
  const p0 = useSharedValue(0);
  const p1 = useSharedValue(0);

  useEffect(() => {
    const springCfg = { damping: 16, stiffness: 210, mass: 0.85 };
    if (open) {
      backdrop.value = withTiming(1, { duration: reduced ? 1 : 200 });
      if (reduced) {
        p0.value = 1;
        p1.value = 1;
      } else {
        p0.value = withDelay(0, withSpring(1, springCfg));
        p1.value = withDelay(48, withSpring(1, springCfg));
        if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      backdrop.value = withTiming(0, { duration: reduced ? 1 : 160 });
      const out = { duration: reduced ? 1 : 110 };
      p0.value = withTiming(0, out);
      p1.value = withTiming(0, out);
    }
  }, [open, reduced, backdrop, p0, p1]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value * 0.52 }));

  const st0 = useAnimatedStyle(() => ({
    opacity: p0.value,
    transform: [
      { translateX: OFFSETS_FROM_HEADER[0].x * p0.value },
      { translateY: OFFSETS_FROM_HEADER[0].y * p0.value },
      { scale: 0.88 + p0.value * 0.14 },
    ],
  }));
  const st1 = useAnimatedStyle(() => ({
    opacity: p1.value,
    transform: [
      { translateX: OFFSETS_FROM_HEADER[1].x * p1.value },
      { translateY: OFFSETS_FROM_HEADER[1].y * p1.value },
      { scale: 0.88 + p1.value * 0.14 },
    ],
  }));
  const itemStyles = [st0, st1];

  return (
    <View pointerEvents={open ? "box-none" : "none"} style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }, backdropStyle]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} disabled={!open} accessibilityRole="button" accessibilityLabel="Close shortcuts" />

      <View style={[styles.anchor, { top: topOffset, right: rightOffset }]} pointerEvents="box-none">
        {ACTIONS.map((a, i) => (
          <Animated.View key={a.key} style={[styles.radialBtnWrap, itemStyles[i]]}>
            <Pressable
              disabled={!open}
              onPress={() => {
                if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
                a.onPress();
              }}
              style={[styles.fabPill, { backgroundColor: colors.card, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              <Feather name={a.icon} size={18} color="#a855f7" />
              <Text style={[styles.label, { color: colors.foreground }]}>{a.label}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  anchor: {
    position: "absolute",
    width: 200,
    height: 240,
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  radialBtnWrap: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
