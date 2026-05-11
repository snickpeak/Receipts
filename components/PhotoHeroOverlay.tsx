import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import { Modal, Platform, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import type { PhotoHeroPayload } from "@/context/PhotoHeroContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const SPRING = { damping: 23, stiffness: 210, mass: 0.88 };

type Props = {
  hero: PhotoHeroPayload;
  destinationRef: React.RefObject<View | null>;
  onComplete: () => void;
};

/**
 * Fullscreen modal hero: list thumbnail (window coords) → measured detail photo slot.
 */
export function PhotoHeroOverlay({ hero, destinationRef, onComplete }: Props) {
  const reducedMotion = useReducedMotion();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const x = useSharedValue(hero.x);
  const y = useSharedValue(hero.y);
  const w = useSharedValue(Math.max(hero.width, 1));
  const h = useSharedValue(Math.max(hero.height, 1));
  const radius = useSharedValue(10);

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: x.value,
    top: y.value,
    width: w.value,
    height: h.value,
    borderRadius: radius.value,
    overflow: "hidden",
  }));

  useEffect(() => {
    if (reducedMotion) {
      onCompleteRef.current();
      return;
    }
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let tries = 0;

    const finish = () => {
      if (!cancelled) onCompleteRef.current();
    };

    const animateToDestination = () => {
      tries += 1;
      destinationRef.current?.measureInWindow((tx, ty, tw, th) => {
        if (cancelled) return;
        if ((tw < 12 || th < 12) && tries < 24) {
          timeouts.push(setTimeout(animateToDestination, 42));
          return;
        }

        x.value = hero.x;
        y.value = hero.y;
        w.value = Math.max(hero.width, 1);
        h.value = Math.max(hero.height, 1);
        radius.value = 10;

        if (tw < 12 || th < 12) {
          timeouts.push(setTimeout(finish, 32));
          return;
        }

        x.value = withSpring(tx, SPRING);
        y.value = withSpring(ty, SPRING);
        w.value = withSpring(tw, SPRING);
        h.value = withSpring(th, SPRING);
        radius.value = withSpring(16, SPRING);

        timeouts.push(setTimeout(finish, 540));
      });
    };

    const id = requestAnimationFrame(() => requestAnimationFrame(animateToDestination));

    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      timeouts.forEach(clearTimeout);
    };
  }, [destinationRef, hero.height, hero.width, hero.x, hero.y, h, radius, reducedMotion, w, x, y]);

  if (reducedMotion) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent={Platform.OS === "android"}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]} pointerEvents="none">
        <Animated.View style={animatedStyle}>
          <Image source={{ uri: hero.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        </Animated.View>
      </View>
    </Modal>
  );
}
