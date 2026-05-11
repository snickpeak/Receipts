import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import React, { useCallback, useEffect } from "react";
import { Dimensions, Modal, Platform, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from "react-native-reanimated";

import { useReducedMotion } from "@/hooks/useReducedMotion";

const { width: W, height: H } = Dimensions.get("window");

type Props = {
  uri: string | null;
  visible: boolean;
  onClose: () => void;
};

export function PinchZoomImageModal({ uri, visible, onClose }: Props) {
  const reducedMotion = useReducedMotion();
  const scheme = useColorScheme();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const resetTransforms = useCallback(() => {
    const d = reducedMotion ? 0 : 220;
    scale.value = withTiming(1, { duration: d });
    savedScale.value = 1;
    tx.value = withTiming(0, { duration: d });
    ty.value = withTiming(0, { duration: d });
    savedTx.value = 0;
    savedTy.value = 0;
  }, [reducedMotion, savedScale, savedTx, savedTy, scale, tx, ty]);

  useEffect(() => {
    if (visible) resetTransforms();
  }, [visible, resetTransforms]);

  const pinchGesture = Gesture.Pinch()
    .enabled(!reducedMotion)
    .onUpdate((e) => {
      scale.value = Math.min(6, Math.max(0.6, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .enabled(!reducedMotion)
    .activeOffsetX([-10, 10])
    .activeOffsetY([-10, 10])
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .enabled(!reducedMotion)
    .onEnd(() => {
      runOnJS(resetTransforms)();
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture, doubleTap);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  const hint = Platform.OS === "web" ? "Gestures vary on web browsers." : "Pinch · drag · double-tap to reset";

  if (!uri) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.screen}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={40} tint={scheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.dim]} />
        )}
        <GestureDetector gesture={composed}>
          <Animated.View style={styles.hitArea}>
            <Animated.View style={[styles.imgWrap, imageStyle]}>
              <Image source={{ uri }} style={styles.image} contentFit="contain" accessibilityLabel="Entry photo enlarged" />
            </Animated.View>
          </Animated.View>
        </GestureDetector>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              resetTransforms();
              onClose();
            }}
            style={styles.closeBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close preview"
          >
            <Feather name="x" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.hint}>{hint}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "rgba(0,0,0,0.88)" },
  dim: { backgroundColor: "rgba(0,0,0,0.85)" },
  hitArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  imgWrap: { width: W, height: H * 0.72, justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: "100%" },
  topBar: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: { flex: 1, color: "#ffffffaa", fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "right" },
});
