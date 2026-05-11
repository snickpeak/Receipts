import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/hooks/useTranslation";

export const ONBOARDING_KEY = "receipts_onboarded_v1";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STEP_META = [
  { icon: "layers" as const, gradient: ["#a855f730", "#7c3aed18"] as [string, string], iconColor: "#a855f7" },
  { icon: "tag" as const, gradient: ["#f59e0b25", "#a855f715"] as [string, string], iconColor: "#f59e0b" },
  { icon: "paperclip" as const, gradient: ["#3b82f625", "#a855f715"] as [string, string], iconColor: "#3b82f6" },
  { icon: "shield" as const, gradient: ["#22c55e25", "#3b82f615"] as [string, string], iconColor: "#22c55e" },
];

const TAG_COLORS: Record<string, string> = {
  Win: "#f59e0b", Money: "#22c55e", Memory: "#a855f7", Promise: "#3b82f6", Proof: "#ef4444",
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const c = {
    bg: isDark ? "#080808" : "#f5f5f5",
    text: isDark ? "#f0f0f0" : "#111111",
    textMuted: isDark ? "#888" : "#555",
    textFaint: isDark ? "#555" : "#999",
    tagRowBg: isDark ? "#ffffff06" : "#00000006",
    tagDesc: isDark ? "#777" : "#666",
    dotInactive: isDark ? "#333" : "#d4d4d4",
  };

  const steps = t.onboarding.steps.map((s, i) => ({ ...STEP_META[i], ...s }));

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setCurrentStep(index);
    Haptics.selectionAsync();
  };

  const handleContinue = async () => {
    if (currentStep < steps.length - 1) {
      goTo(currentStep + 1);
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)" as any);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)" as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg, paddingTop: topInset }]}>
      {/* Skip button */}
      {currentStep < steps.length - 1 && (
        <Pressable onPress={handleSkip} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: c.textFaint }]}>Skip</Text>
        </Pressable>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {steps.map((step, index) => (
          <View key={index} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <LinearGradient
              colors={step.gradient}
              style={styles.iconWrap}
            >
              <Feather name={step.icon} size={42} color={step.iconColor} />
            </LinearGradient>

            <Text style={[styles.title, { color: c.text }]}>{step.title}</Text>

            {"body" in step && step.body ? (
              <Text style={[styles.body, { color: c.textMuted }]}>{step.body as string}</Text>
            ) : null}

            {"tags" in step && step.tags ? (
              <View style={styles.tagList}>
                {Object.entries(step.tags as Record<string, string>).map(([label, desc]) => {
                  const color = TAG_COLORS[label] ?? "#a855f7";
                  return (
                    <View key={label} style={[styles.tagRow, { backgroundColor: c.tagRowBg, borderColor: color + "30" }]}>
                      <View style={[styles.tagDot, { backgroundColor: color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.tagLabel, { color }]}>{label.toUpperCase()}</Text>
                        <Text style={[styles.tagDesc, { color: c.tagDesc }]}>{desc}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      {/* Bottom: dots + button */}
      <View style={[styles.bottom, { paddingBottom: bottomInset + 16 }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === currentStep ? "#a855f7" : c.dotInactive,
                    width: i === currentStep ? 24 : 8,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* CTA button */}
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={["#a855f7", "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>{steps[currentStep].cta}</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  slide: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 20,
    paddingBottom: 80,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  body: {
    fontSize: 17,
    fontFamily: "Inter_400Regular",
    color: "#888",
    lineHeight: 27,
    letterSpacing: -0.1,
  },
  tagList: {
    width: "100%",
    gap: 10,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "#ffffff06",
  },
  tagDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tagLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  tagDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#777",
  },
  bottom: {
    paddingHorizontal: 32,
    paddingTop: 24,
    gap: 20,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaBtn: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.2,
  },
});
