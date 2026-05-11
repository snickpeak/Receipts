import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { AnimatedCounter } from "@/components/animations/AnimatedCounter";
import { FadeInView } from "@/components/animations/FadeInView";
import { DAILY_PROMPTS, getDailyBaseIndex } from "@/constants/prompts";
import { useEntries } from "@/context/EntriesContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { computeStreak, loadBestStreak } from "@/lib/streakLib";
import { getTagColor, getTagIcon } from "@/lib/tagsLib";

const CARD_HEIGHT = 116;
const STACK_TOTAL_HEIGHT = CARD_HEIGHT + 20;

export function HeroSection() {
  const colors = useColors();
  const { entries } = useEntries();
  const { settings } = useSettings();
  const [shuffleIdx, setShuffleIdx] = useState(0);
  const baseIndex = getDailyBaseIndex();
  const prompt = DAILY_PROMPTS[(baseIndex + shuffleIdx) % DAILY_PROMPTS.length];

  const tagColor = getTagColor(prompt.tag, settings.customTags);
  const tagIcon = getTagIcon(prompt.tag, settings.customTags);

  const spinValue = useSharedValue(0);
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinValue.value}deg` }],
  }));

  const handleShuffle = () => {
    spinValue.value = withSequence(
      withTiming(180, { duration: 220 }),
      withTiming(360, { duration: 220 }),
    );
    setShuffleIdx((i) => i + 1);
  };

  // Compute streak internally
  const [bestStreak, setBestStreak] = useState(0);
  useEffect(() => {
    void loadBestStreak().then(setBestStreak);
  }, []);
  const streak = useMemo(
    () => computeStreak(entries.map((e) => e.createdAt), bestStreak),
    [entries, bestStreak],
  );

  // Top tag by count
  const topTag = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      counts[e.tag] = (counts[e.tag] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ?? null;
  }, [entries]);

  const topTagColor = topTag ? getTagColor(topTag[0], settings.customTags) : "#a855f7";

  // True ±6px floating animation, 2500ms cycle
  const floatY = useSharedValue(-6);
  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(6, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const accentColor = "#a855f7";

  return (
    <FadeInView from="bottom" distance={28} delay={80} spring style={styles.wrapper}>
      {/* ── Layered 3D card stack ──────────────────────────────────── */}
      <View style={styles.stackContainer}>
        {/* Layer 1 — deepest, most tilted */}
        <View
          style={[
            styles.stackCard,
            styles.stackCardLayer1,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: "#000",
            },
          ]}
        />

        {/* Layer 2 — medium tilt */}
        <View
          style={[
            styles.stackCard,
            styles.stackCardLayer2,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: "#000",
            },
          ]}
        />

        {/* Layer 3 — slight tilt */}
        <View
          style={[
            styles.stackCard,
            styles.stackCardLayer3,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: "#000",
            },
          ]}
        />

        {/* Front stats card — straight, on top */}
        <LinearGradient
          colors={[accentColor + "24", accentColor + "0a", colors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1.2, y: 1 }}
          style={[
            styles.stackCard,
            styles.statsCard,
            { borderColor: accentColor + "35", shadowColor: accentColor },
          ]}
        >
          <View style={styles.statsCardLabel}>
            <View style={[styles.labelDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.labelText, { color: accentColor }]}>YOUR RECEIPTS</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <AnimatedCounter
                value={entries.length}
                style={[styles.statNumber, { color: colors.foreground }]}
              />
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>total</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.foreground }]}>
                {streak.current > 0 ? `🔥 ${streak.current}` : "—"}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {streak.current === 1 ? "day" : "days"}
              </Text>
            </View>

            {topTag && (
              <>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <View style={styles.topTagRow}>
                    <View style={[styles.topTagDot, { backgroundColor: topTagColor }]} />
                    <Text style={[styles.statNumber, styles.statNumberTag, { color: colors.foreground }]}>
                      {topTag[0]}
                    </Text>
                  </View>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>top tag</Text>
                </View>
              </>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* ── Floating daily challenge card ─────────────────────────── */}
      <Animated.View style={floatStyle}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push({ pathname: "/add", params: { prompt: prompt.text, tag: prompt.tag } } as any);
          }}
          style={({ pressed }) => [styles.challengePressable, { opacity: pressed ? 0.88 : 1 }]}
        >
          <LinearGradient
            colors={[tagColor + "2e", tagColor + "12", tagColor + "06"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.challengeCard,
              { borderColor: tagColor + "45", shadowColor: tagColor },
            ]}
          >
            <View style={styles.challengeTop}>
              <View style={styles.challengeLabelRow}>
                <View style={[styles.challengeDot, { backgroundColor: tagColor }]} />
                <Text style={[styles.challengeLabel, { color: tagColor }]}>
                  TODAY'S CHALLENGE · {prompt.tag.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.challengeBadge, { backgroundColor: tagColor + "22" }]}>
                <Feather name={tagIcon as any} size={13} color={tagColor} />
              </View>
            </View>

            <Text style={[styles.challengeText, { color: colors.foreground }]}>
              {prompt.text}
            </Text>

            <View style={styles.challengeFooter}>
              <View style={[styles.challengeBtn, { backgroundColor: tagColor }]}>
                <Text style={styles.challengeBtnText}>Write about this</Text>
                <Feather name="arrow-right" size={13} color="#000" />
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleShuffle();
                }}
                hitSlop={10}
                style={[styles.shuffleBtn, { backgroundColor: colors.muted }]}
              >
                <Animated.View style={spinStyle}>
                  <Feather name="refresh-cw" size={13} color={colors.mutedForeground} />
                </Animated.View>
              </Pressable>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 14,
  },

  /* ── Card stack ──────────────────────────────────────────────── */
  stackContainer: {
    height: STACK_TOTAL_HEIGHT,
    position: "relative",
  },
  stackCard: {
    position: "absolute",
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    borderRadius: 20,
    borderWidth: 1,
  },
  // Deepest: most rotation, most offset from center
  stackCardLayer1: {
    bottom: 0,
    left: 14,
    right: 14,
    transform: [{ rotate: "-4.5deg" }, { translateY: -6 }],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    zIndex: 1,
  },
  // Middle layer
  stackCardLayer2: {
    bottom: 0,
    left: 7,
    right: 7,
    transform: [{ rotate: "-2.2deg" }, { translateY: -3 }],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 2,
  },
  // Nearest background layer — very slight tilt
  stackCardLayer3: {
    bottom: 0,
    left: 3,
    right: 3,
    transform: [{ rotate: "-0.8deg" }, { translateY: -1 }],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 3,
  },
  // Front card — no rotation, full width
  statsCard: {
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 4,
  },

  statsCardLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.6,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  statNumberTag: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    height: 36,
    borderRadius: 1,
    marginHorizontal: 4,
  },
  topTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  topTagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  /* ── Floating challenge card ──────────────────────────────────── */
  challengePressable: {
    borderRadius: 20,
  },
  challengeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 11,
    transform: [{ rotate: "-1.2deg" }],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
  challengeTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  challengeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  challengeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  challengeLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
  },
  challengeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  challengeText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  challengeFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  challengeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  challengeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  challengeTapHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  shuffleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
