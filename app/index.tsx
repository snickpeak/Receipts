import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/PressableScale";

export default function Index() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 24);
  const isDark = useColorScheme() === "dark";

  const c = {
    bg: isDark ? "#080808" : "#ffffff",
    brand: isDark ? "#555" : "#999",
    title: isDark ? "#fff" : "#0a0a0a",
    subtitle: isDark ? "#777" : "#666",
    primaryBtnText: "#fff",
    secondaryBtnText: "#a855f7",
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg, paddingTop: topInset, paddingBottom: Math.max(insets.bottom, 24) }]}>
      <LinearGradient colors={["#a855f730", "transparent"]} style={styles.logoWrap}>
        <Feather name="layers" size={34} color="#a855f7" />
      </LinearGradient>
      <Text style={[styles.brand, { color: c.brand }]}>RECEIPTS</Text>
      <Text style={[styles.title, { color: c.title }]}>Capture your day like proof.</Text>
      <Text style={[styles.subtitle, { color: c.subtitle }]}>Preview the private journal, receipt capture, and AI search experience.</Text>

      <PressableScale style={styles.primaryBtn} haptic="medium" onPress={() => router.replace("/(tabs)")}>
        <Text style={[styles.primaryBtnText, { color: c.primaryBtnText }]}>Open preview</Text>
      </PressableScale>
      <PressableScale style={styles.secondaryBtn} scaleTo={0.96} onPress={() => router.replace("/(auth)/sign-in")}>
        <Text style={[styles.secondaryBtnText, { color: c.secondaryBtnText }]}>Go to sign in</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 14 },
  logoWrap: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  brand: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", textAlign: "center", letterSpacing: -0.6, lineHeight: 36 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24, maxWidth: 300 },
  primaryBtn: { width: "100%", backgroundColor: "#a855f7", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 10 },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  secondaryBtn: { width: "100%", padding: 16, alignItems: "center" },
  secondaryBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
