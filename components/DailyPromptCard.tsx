import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { getDailyPrompt } from "@/constants/prompts";

const TAG_COLORS: Record<string, string> = {
  Money: "#22c55e",
  Promise: "#3b82f6",
  Memory: "#a855f7",
  Win: "#f59e0b",
  Proof: "#ef4444",
};

const TAG_ICONS: Record<string, string> = {
  Win: "award",
  Money: "dollar-sign",
  Memory: "heart",
  Promise: "check-circle",
  Proof: "shield",
};

export function DailyPromptCard() {
  const colors = useColors();
  const [dismissed, setDismissed] = useState(false);
  const prompt = getDailyPrompt();

  if (dismissed) return null;

  const tagColor = TAG_COLORS[prompt.tag];

  const handleWrite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/add", params: { prompt: prompt.text, tag: prompt.tag } } as any);
  };

  const handleDismiss = () => {
    Haptics.selectionAsync();
    setDismissed(true);
  };

  return (
    <LinearGradient
      colors={[tagColor + "20", tagColor + "08", "transparent"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor: tagColor + "30" }]}
    >
      <View style={styles.topRow}>
        <View style={[styles.labelRow]}>
          <View style={[styles.dot, { backgroundColor: tagColor }]} />
          <Text style={[styles.label, { color: tagColor }]}>TODAY'S PROMPT · {prompt.tag.toUpperCase()}</Text>
        </View>
        <Pressable onPress={handleDismiss} hitSlop={10}>
          <Feather name="x" size={14} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <Text style={[styles.promptText, { color: colors.foreground }]}>{prompt.text}</Text>

      <Pressable
        onPress={handleWrite}
        style={({ pressed }) => [styles.writeBtn, { backgroundColor: tagColor, opacity: pressed ? 0.8 : 1 }]}
      >
        <Feather name={TAG_ICONS[prompt.tag] as any} size={13} color="#000" />
        <Text style={styles.writeBtnText}>Write about this</Text>
        <Feather name="arrow-right" size={13} color="#000" />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 2,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
  },
  promptText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  writeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    borderRadius: 100,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
  },
  writeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
});
