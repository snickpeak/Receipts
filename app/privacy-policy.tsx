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
    heading: "The short version",
    body:
      "Your journal entries live on your device. We do not sell your data, we do not run advertising, and we have no analytics or tracking SDKs in the app whatsoever. The only data that ever leaves your device is: your email address (if you sign in), typed place-search text (sent to a free geocoding service to look up city names), and app code updates delivered by Expo. Everything else — entries, photos, voice memos, search — stays on your device.",
  },
  {
    heading: "What information we collect",
    body:
      "If you use the app without an account (guest mode), we collect nothing. If you create an account, we store your email address via Clerk (our authentication provider) to identify your account and allow sign-in. We do not collect your name, phone number, date of birth, payment details, or any demographic information.",
  },
  {
    heading: "Device permissions and what they are used for",
    body:
      "Face ID / Touch ID: used only to lock the app and require biometric verification to open it — your biometric data never leaves your device and is handled entirely by iOS.\n\nCamera: used to take photos you choose to attach to entries, and optionally to read visible text from an image into your entry notes (on-device OCR).\n\nPhoto Library: used only when you explicitly choose to attach an image from your camera roll to an entry.\n\nLocation (when-in-use only): used to tag where an entry was written, only when you tap the location button. The app never accesses your location in the background.\n\nMicrophone: used only when you tap the voice memo button to record an audio note. Recordings are saved locally and never uploaded.\n\nNotifications: used only for the optional daily journaling reminder you can configure in Settings. You can disable this at any time.",
  },
  {
    heading: "How your data is stored",
    body:
      "All journal entries are stored locally on your device using AsyncStorage. Your authentication tokens and biometric credentials are stored in the iOS Keychain (via SecureStore), which is encrypted by the operating system and never accessible to other apps. App settings are stored locally on-device.\n\nThere is currently no active backend server. This means your entries are not synced to any cloud and exist solely on your device. If you delete the app, your entries will be permanently lost unless you export a backup first.",
  },
  {
    heading: "End-to-end encryption",
    body:
      "End-to-end encryption is an opt-in feature, off by default. When you enable it in Settings and set a passphrase, your entries are encrypted on your device using AES-256 (via the crypto-js library) before being stored. The encryption key is derived from your passphrase using PBKDF2 with 4,096 iterations. Your passphrase never leaves your device — we have no way to read your encrypted entries or recover your passphrase if you forget it.",
  },
  {
    heading: "Photos and photo metadata",
    body:
      "Photos attached to entries are stored locally on your device and are never uploaded to any server. Photo metadata stripping is turned on by default. This means that before a photo is saved to an entry, EXIF data (which can include GPS coordinates, device model, and shooting time) is automatically removed. You can toggle this setting in Settings → Privacy. If metadata stripping is on and you export your journal, the exported photos will not contain location or device information.",
  },
  {
    heading: "Voice memos",
    body:
      "Voice memos are saved as audio files (named by timestamp, e.g. voice-memo-1234567890.m4a) inside the app's private sandboxed Documents folder on your device. This folder is managed by iOS and is not visible or accessible to other apps or through the Files app. Voice memos are never uploaded or transmitted anywhere. If you delete an entry, its attached voice memo is also deleted from that folder.",
  },
  {
    heading: "Location data",
    body:
      "When you tap the location button while creating an entry, the app requests your current GPS coordinates and passes them to Apple's on-device reverse-geocoding API to produce a human-readable place name (city, area). Your GPS coordinates are not sent to us or to any third party for this purpose.\n\nWhen you use the manual 'Add place' search field and type a city name, that search text is sent to the Photon geocoding API operated by Komoot (photon.komoot.io) to return matching place suggestions. Only what you type in that search box is sent — not your GPS coordinates. Komoot's service is subject to their own privacy policy.",
  },
  {
    heading: "Third-party services",
    body:
      "Clerk (clerk.com): handles account creation and sign-in. Clerk processes your email address to authenticate you. Clerk's privacy policy applies to data they handle.\n\nKomoot / Photon (photon.komoot.io): a free, open-source geocoding API used only for the manual place-name search feature. No account or API key is required, and your GPS location is not sent to them.\n\nExpo (expo.dev): the platform the app is built on. Expo may deliver over-the-air JavaScript updates to the app without a full App Store release. These updates are limited to the app's JavaScript code and cannot access your journal data. Expo's privacy policy applies to their update infrastructure.",
  },
  {
    heading: "No tracking, advertising, or analytics",
    body:
      "There are no advertising SDKs, analytics libraries, crash-reporting services, session-recording tools, or behavioural tracking of any kind in the app. We do not use your Advertising Identifier (IDFA). We do not share data with data brokers. We have verified this by auditing every dependency in the app.",
  },
  {
    heading: "On-device search",
    body:
      "The search feature uses a TF-IDF algorithm that runs entirely on your device. Your search queries and entry content are never transmitted anywhere for search purposes.",
  },
  {
    heading: "Shake-to-lock and accelerometer",
    body:
      "The app reads your device's accelerometer to detect a vigorous shake gesture, which instantly locks the app. Accelerometer data is processed in real time on-device and is never stored or transmitted.",
  },
  {
    heading: "Data export and backup",
    body:
      "You can export your entries as a Markdown file or as an encrypted backup file at any time from Settings. Exports are saved to your device's Files app or shared via the iOS share sheet. Nothing is automatically uploaded anywhere — you are in full control of where your export goes.",
  },
  {
    heading: "Data retention and deletion",
    body:
      "You can delete individual entries, restore them from the trash within 30 days, or permanently wipe all entries from Settings. You can delete your account from Settings, which removes your Clerk authentication record. Since all entry data is currently stored locally, deleting the app removes all your data. There is no cloud backup to delete.",
  },
  {
    heading: "Children's privacy",
    body:
      "Receipts is intended for users aged 13 and over. The app is not designed or marketed as a child-safe product — it is an adult journaling app. Users under 13 are not permitted to create an account or use the app. This is an age restriction, not a safety endorsement. We do not knowingly collect personal information from anyone under 13. If you believe a child under 13 has used the app, please contact us at receipts.support@gmail.com and we will delete any associated data.",
  },
  {
    heading: "Changes to this policy",
    body:
      "If we make material changes to this policy — such as introducing a backend server, adding a third-party service, or changing how we use your data — we will update this screen and, where required by law, notify you in-app. The effective date at the top of this screen will always reflect the most recent version.",
  },
  {
    heading: "Contact",
    body:
      "Questions, concerns, or requests regarding your privacy or data can be sent to receipts.support@gmail.com. We aim to respond within 5 business days.",
  },
];

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.effectiveDate, { color: colors.mutedForeground }]}>
          Effective date: May 11, 2025
        </Text>

        {SECTIONS.map((section, index) => (
          <View
            key={section.heading}
            style={[
              styles.section,
              index === 0 && styles.sectionFirst,
              index === 0 && { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            {index === 0 && (
              <View style={styles.summaryBadge}>
                <Feather name="shield" size={12} color={colors.mutedForeground} />
                <Text style={[styles.summaryBadgeText, { color: colors.mutedForeground }]}>SUMMARY</Text>
              </View>
            )}
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
              {section.heading}
            </Text>
            {section.body.split("\n\n").map((paragraph, i) => (
              <Text key={i} style={[styles.sectionBody, { color: colors.mutedForeground }]}>
                {paragraph}
              </Text>
            ))}
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
    paddingTop: 20,
  },
  effectiveDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 20,
    marginTop: 20,
    gap: 8,
  },
  sectionFirst: {
    borderTopWidth: 0,
    marginTop: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  summaryBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
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
