import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Section {
  heading: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    heading: "What we collect",
    body:
      "Receipts stores your journal entries locally on your device. If you create an account, your entries may be synced to our servers solely to enable access across your devices. We collect only what is necessary to provide this service: your email address, and the content you choose to save.",
  },
  {
    heading: "How your data is used",
    body:
      "Your entries are used only to display them back to you. We do not sell, share, or monetise your personal data. We do not use your journal content to train machine-learning models or for advertising purposes.",
  },
  {
    heading: "End-to-end encryption",
    body:
      "When you enable end-to-end encryption in Settings, your entries are encrypted on-device using AES-256 before being stored or synced. Your passphrase never leaves your device, and we cannot read your encrypted entries.",
  },
  {
    heading: "Data stored on your device",
    body:
      "All entries are stored locally using AsyncStorage on your device. If you use the app without an account (guest mode), your data exists only on your device and is never transmitted to our servers.",
  },
  {
    heading: "Third-party services",
    body:
      "We use Clerk for authentication. If you sign in, Clerk processes your email address in accordance with their own privacy policy. We do not integrate with advertising networks or analytics platforms that track your personal behaviour.",
  },
  {
    heading: "Data retention & deletion",
    body:
      "You can delete individual entries, clear all entries, or delete your account at any time from the Settings screen. When you delete your account, all server-side data associated with your account is permanently removed within 30 days.",
  },
  {
    heading: "Children's privacy",
    body:
      "Receipts is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so we can delete it.",
  },
  {
    heading: "Changes to this policy",
    body:
      "We may update this Privacy Policy from time to time. When we do, the updated version will be available in-app. Continued use of the app after changes constitutes acceptance of the revised policy.",
  },
  {
    heading: "Contact us",
    body:
      "If you have questions about this Privacy Policy or how your data is handled, please reach out at support@receipts.app.",
  },
];

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.effectiveDate, { color: colors.mutedForeground }]}>
          Effective date: January 1, 2025
        </Text>

        <Text style={[styles.intro, { color: colors.foreground }]}>
          Your privacy matters. Receipts is built around the idea that your moments are yours — we
          treat your data with that same respect.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.heading} style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
              {section.heading}
            </Text>
            <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 0,
  },
  effectiveDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  intro: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 23,
    marginBottom: 8,
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 20,
    marginTop: 20,
    gap: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
  },
  sectionBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
});
