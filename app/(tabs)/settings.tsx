import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useAuth, useClerk, useUser } from "@clerk/expo";
import { clearBiometricCredentials } from "@/hooks/biometricSignIn";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEntries } from "@/context/EntriesContext";
import { entriesToMarkdown, totalWordsAcross } from "@/lib/exportLib";
import { DEFAULT_TAGS as DEFAULT_TAGS_LIB } from "@/lib/tagsLib";
import { useLock } from "@/context/LockContext";
import {
  useSettings,
  generateRecoveryCode,
  hashCode,
  backupEncrypt,
  backupDecrypt,
  xorDecrypt,
} from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { generateSalt } from "@/lib/cryptoLib";
import { PressableScale } from "@/components/PressableScale";
import { SpringSwitch } from "@/components/SpringSwitch";
import { FadeInView } from "@/components/animations";
import { HomeLocationPickerModal } from "@/components/HomeLocationPickerModal";
import { useLocaleFont } from "@/hooks/useLocaleFont";
import { useTranslation } from "@/hooks/useTranslation";
import { SUPPORTED_LANGUAGES } from "@/i18n/translations";
import { SUPPORTED_CURRENCIES } from "@/i18n/currencies";
import { getRestApiBase, getShareWebBase, warnMissingNativeDomainOnce } from "@/lib/env";
import { composeHomeLocationLine } from "@/lib/photonGeocode";

const AUTO_LOCK_OPTIONS = [
  { label: "Immediately", value: 0 },
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "5 minutes", value: 300 },
  { label: "Never", value: -1 },
];

async function scheduleNotification(hour: number, minute: number) {
  if (Platform.OS === "web") return;
  try {
    const Notifications = require("expo-notifications");
    await Notifications.requestPermissionsAsync();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled.map((notification: { identifier: string }) => Notifications.cancelScheduledNotificationAsync(notification.identifier)));
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "What happened today worth saving?",
        body: "Open Receipts to log a memory, win, or proof.",
      },
      trigger: { hour, minute, repeats: true } as any,
    });
  } catch {}
}

async function cancelNotifications() {
  if (Platform.OS === "web") return;
  try {
    const Notifications = require("expo-notifications");
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

// ── Per-prompt notification helpers ─────────────────────────────────────────
const PROMPT_NOTIF_KEY = "receipts_prompt_notif_ids";

async function getPromptNotifIds(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(PROMPT_NOTIF_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function schedulePromptNotification(id: string, text: string) {
  if (Platform.OS === "web") return;
  try {
    const Notifications = require("expo-notifications");
    await Notifications.requestPermissionsAsync();
    const ids = await getPromptNotifIds();
    if (ids[id]) {
      try { await Notifications.cancelScheduledNotificationAsync(ids[id]); } catch {}
    }
    const isDaily = id === "daily-memory";
    const trigger = isDaily
      ? { hour: 21, minute: 0, repeats: true } as any
      : { weekday: 1, hour: 20, minute: 0, repeats: true } as any;
    const notifId: string = await Notifications.scheduleNotificationAsync({
      content: {
        title: text,
        body: "Open Receipts to write about this.",
        data: { promptId: id },
      },
      trigger,
    });
    ids[id] = notifId;
    await AsyncStorage.setItem(PROMPT_NOTIF_KEY, JSON.stringify(ids));
  } catch {}
}

async function cancelPromptNotification(id: string) {
  if (Platform.OS === "web") return;
  try {
    const Notifications = require("expo-notifications");
    const ids = await getPromptNotifIds();
    if (ids[id]) {
      await Notifications.cancelScheduledNotificationAsync(ids[id]);
      delete ids[id];
      await AsyncStorage.setItem(PROMPT_NOTIF_KEY, JSON.stringify(ids));
    }
  } catch {}
}

function Section({ title, children, delay }: { title: string; children: React.ReactNode; delay?: number }) {
  const colors = useColors();
  return (
    <FadeInView delay={delay ?? 0} from="bottom" distance={10} spring>
    <View style={sectionStyles.wrapper}>
      <Text style={[sectionStyles.label, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[sectionStyles.card, { backgroundColor: colors.muted, borderColor: colors.border }]}>{children}</View>
    </View>
    </FadeInView>
  );
}
const sectionStyles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5, paddingHorizontal: 4 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
});

function SettingRow({
  icon, label, sublabel, right, onPress, danger, borderTop,
}: {
  icon: string; label: string; sublabel?: string; right?: React.ReactNode;
  onPress?: () => void; danger?: boolean; borderTop?: boolean;
}) {
  const colors = useColors();
  const font = useLocaleFont();
  const content = (
    <>
      <Feather name={icon as any} size={16} color={danger ? "#ef4444" : colors.mutedForeground} />
      <View style={{ flex: 1 }}>
        <Text style={[rowStyles.label, { color: danger ? "#ef4444" : colors.foreground, fontFamily: font.medium }]}>{label}</Text>
        {sublabel ? <Text style={[rowStyles.sublabel, { color: colors.mutedForeground, fontFamily: font.regular }]}>{sublabel}</Text> : null}
      </View>
      {right ?? (onPress && <Feather name="chevron-right" size={14} color={colors.mutedForeground} />)}
    </>
  );
  const baseStyle = [
    rowStyles.row,
    { borderTopWidth: borderTop ? StyleSheet.hairlineWidth : 0, borderTopColor: colors.border },
  ];
  if (!onPress) {
    return <View style={baseStyle}>{content}</View>;
  }
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      opacityTo={0.7}
      haptic="selection"
      style={baseStyle}
      accessibilityRole="button"
      accessibilityLabel={sublabel ? `${label}, ${sublabel}` : label}
    >
      {content}
    </PressableScale>
  );
}
const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  label: { fontSize: 15, fontFamily: "Inter_500Medium" },
  sublabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});

export default function SettingsScreen() {
  const colors = useColors();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, loaded } = useSettings();
  const { entries, trashedEntries, importEntries, deleteAllEntries, clearLocalEntries, renameTagEverywhere, localOnlyMode, pendingSyncCount } = useEntries();
  const totalWords = useMemo(() => totalWordsAcross(entries), [entries]);
  const TIMEZONES = useMemo<string[]>(() => {
    try { return (Intl as any).supportedValuesOf("timeZone") as string[]; } catch {
      return ["UTC","America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Toronto","America/Vancouver","America/Sao_Paulo","Europe/London","Europe/Dublin","Europe/Paris","Europe/Berlin","Europe/Rome","Europe/Madrid","Europe/Amsterdam","Europe/Stockholm","Europe/Moscow","Africa/Nairobi","Africa/Lagos","Asia/Dubai","Asia/Kolkata","Asia/Dhaka","Asia/Bangkok","Asia/Singapore","Asia/Shanghai","Asia/Tokyo","Asia/Seoul","Australia/Sydney","Australia/Melbourne","Pacific/Auckland","Pacific/Honolulu"];
    }
  }, []);
  // Capture original tag labels at edit-start so cascade renames work even
  // though the visible TextInput updates settings on every keystroke.
  const originalTagLabelsRef = useRef<Map<string, string>>(new Map());
  const { lock } = useLock();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const { user } = useUser();

  // Profile edit
  const [showEditName, setShowEditName] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName ?? "");
  const [editLastName, setEditLastName] = useState(user?.lastName ?? "");
  const [nameLoading, setNameLoading] = useState(false);

  const handleUpdateName = async () => {
    if (!user) return;
    setNameLoading(true);
    try {
      await user.update({ firstName: editFirstName.trim(), lastName: editLastName.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditName(false);
    } catch {
      Alert.alert("Couldn't update name", "Please try again.");
    } finally {
      setNameLoading(false);
    }
  };

  // Delete account flow
  const [showDeleteFlow, setShowDeleteFlow] = useState(false);
  const [deleteEmailCode, setDeleteEmailCode] = useState("");
  const [deleteTargetEmail, setDeleteTargetEmail] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // PIN setup
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");

  // Decoy PIN
  const [showDecoySetup, setShowDecoySetup] = useState(false);
  const [decoyPinInput, setDecoyPinInput] = useState("");

  // Import
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);

  // Notification time
  const [timeInput, setTimeInput] = useState(
    `${String(settings.reminderHour).padStart(2, "0")}:${String(settings.reminderMinute).padStart(2, "0")}`
  );

  // Recovery codes
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [showCodes, setShowCodes] = useState(false);

  // Backup passphrase
  const [showPassphraseSetup, setShowPassphraseSetup] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState("");

  // Auto-lock picker
  const [showAutoLock, setShowAutoLock] = useState(false);
  const [showFontColorPicker, setShowFontColorPicker] = useState(false);
  const [customFontColor, setCustomFontColor] = useState("");
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);
  const [tzSearch, setTzSearch] = useState("");
  const [showHomeLocationPicker, setShowHomeLocationPicker] = useState(false);
  const socialLinks: { label: string; sublabel: string; url?: string; nativeShare?: boolean }[] = [
    { label: "Facebook",  sublabel: "Post to your profile",  url: "https://www.facebook.com/sharer/sharer.php?u=https://receipts.app" },
    { label: "X",         sublabel: "Post to your profile",  url: "https://x.com/intent/tweet?text=Check%20out%20Receipts%20%E2%80%94%20the%20private%20AI%20life%20recorder%20https%3A%2F%2Freceipts.app" },
    { label: "Bluesky",   sublabel: "Post to your profile",  url: "https://bsky.app/intent/compose?text=Check%20out%20Receipts%20%E2%80%94%20the%20private%20AI%20life%20recorder%20https%3A%2F%2Freceipts.app" },
    { label: "Instagram", sublabel: "Share via your device", nativeShare: true },
    { label: "WhatsApp",  sublabel: "Send to a contact",     url: "https://wa.me/?text=Check%20out%20Receipts%20%E2%80%94%20the%20private%20AI%20life%20recorder%20https%3A%2F%2Freceipts.app" },
  ];

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const authHeaders = async () => {
    const token = await getToken();
    return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : {};
  };

  // ── Account deletion ────────────────────────────────────────────────────────
  const handleRequestDeleteCode = async () => {
    const apiBase = getRestApiBase();
    if (!apiBase) {
      warnMissingNativeDomainOnce();
      Alert.alert("Server not configured", "Set EXPO_PUBLIC_DOMAIN in .env (host only) for account deletion on mobile.");
      return;
    }
    try {
      setDeleteLoading(true);
      const res = await fetch(`${apiBase}/account/request-delete-code`, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { email?: string };
      setDeleteTargetEmail(data.email ?? user?.primaryEmailAddress?.emailAddress ?? null);
      setDeleteEmailCode("");
      setShowDeleteFlow(true);
    } catch {
      Alert.alert("Could not send code", "Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteEmailCode.length < 6) return;
    const apiBase = getRestApiBase();
    if (!apiBase) {
      warnMissingNativeDomainOnce();
      Alert.alert("Server not configured", "Set EXPO_PUBLIC_DOMAIN in .env (host only) for account deletion on mobile.");
      return;
    }
    try {
      setDeleteLoading(true);
      const res = await fetch(`${apiBase}/account/delete-account`, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ code: deleteEmailCode }),
      });
      if (!res.ok) throw new Error("delete failed");
      await deleteAllEntries();
      await signOut();
      router.replace("/(auth)/sign-in" as any);
    } catch {
      Alert.alert("Delete failed", "The code was invalid or expired.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Sign out ────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    const hasBackend = !!getRestApiBase();
    const doSignOut = async () => {
      // Only wipe local entries if cloud sync is active and all entries are
      // synced — otherwise data would be permanently lost with no way to
      // restore it on the next sign-in.
      if (hasBackend && !localOnlyMode && pendingSyncCount === 0) {
        await clearLocalEntries();
      }
      await AsyncStorage.removeItem("receipts_guest_mode_v1");
      await clearBiometricCredentials();
      await signOut();
      router.replace("/(auth)/sign-in" as any);
    };
    if (Platform.OS === "web") { await doSignOut(); return; }
    const subtitle = hasBackend && !localOnlyMode
      ? "Are you sure you want to sign out?"
      : "Your entries are saved on this device and will be here when you sign back in.";
    Alert.alert("Sign Out", subtitle, [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: doSignOut },
    ]);
  };

  // ── Backup & restore ────────────────────────────────────────────────────────
  const handleExport = async () => {
    const json = JSON.stringify({ entries, exportedAt: new Date().toISOString(), kind: "receipts-backup-v2" });
    try { await Share.share({ message: json, title: "Receipts Backup" }); } catch {}
  };

  // #10 Markdown bulk export — uses Share.share so it works on iOS/Android/web
  // without bringing in expo-sharing. Entries are concatenated newest-first.
  const handleExportMarkdown = async () => {
    if (entries.length === 0) { Alert.alert("Nothing to export", "Add some entries first."); return; }
    const md = entriesToMarkdown(entries);
    try { await Share.share({ message: md, title: "Receipts.md" }); } catch {}
  };

  // #8 Tag rename + merge — when the user edits a tag label, cascade to every
  // entry that already used the old label. If the new label collides with an
  // existing tag, that's a merge.
  const handleTagLabelCommit = async (tagId: string, newLabel: string) => {
    const tag = settings.customTags.find((t) => t.id === tagId);
    if (!tag) return;
    const oldLabel = originalTagLabelsRef.current.get(tagId) ?? tag.label;
    originalTagLabelsRef.current.delete(tagId);
    const trimmed = newLabel.trim();
    if (!trimmed || trimmed === oldLabel) return;
    const collides = settings.customTags.some((t) => t.id !== tagId && t.label.toLowerCase() === trimmed.toLowerCase());
    const apply = async () => {
      await renameTagEverywhere(oldLabel, trimmed);
      // If merging, drop the now-duplicate tag definition and rename via that label.
      const nextTags = collides
        ? settings.customTags.filter((t) => t.id !== tagId)
        : settings.customTags.map((t) => (t.id === tagId ? { ...t, label: trimmed } : t));
      await updateSettings({ customTags: nextTags });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };
    if (collides && Platform.OS !== "web") {
      Alert.alert("Merge tags?", `"${oldLabel}" entries will be reassigned to "${trimmed}".`, [
        { text: "Cancel", style: "cancel" },
        { text: "Merge", onPress: apply },
      ]);
    } else {
      void apply();
    }
  };

  const handleEncryptedExport = async () => {
    if (!settings.backupPassphrase) { setShowPassphraseSetup(true); return; }
    const json = JSON.stringify({ entries, exportedAt: new Date().toISOString(), kind: "receipts-backup-v2" });
    const encrypted = backupEncrypt(json, settings.backupPassphrase);
    const payload = JSON.stringify({ encrypted: true, data: encrypted, v: 1 });
    try { await Share.share({ message: payload, title: "Receipts Encrypted Backup" }); } catch {}
  };

  const handleImport = async () => {
    try {
      let rawText = importText;
      try {
        const parsed = JSON.parse(importText) as { encrypted?: boolean; data?: string };
        if (parsed.encrypted && parsed.data && settings.backupPassphrase) {
          rawText = backupDecrypt(parsed.data, settings.backupPassphrase);
          if (rawText === parsed.data) rawText = xorDecrypt(parsed.data, settings.backupPassphrase);
        }
      } catch {}
      const parsed = JSON.parse(rawText) as { entries?: unknown } | unknown[];
      const imported = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.entries) ? parsed.entries : []);
      await importEntries(imported);
      setImportText("");
      setShowImport(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Import failed", "Invalid backup format or wrong passphrase.");
    }
  };

  // ── Wipe all ────────────────────────────────────────────────────────────────
  const handleWipeAll = () => {
    if (Platform.OS === "web") { deleteAllEntries(); return; }
    Alert.alert(
      "Wipe All Data",
      `This will permanently delete all ${entries.length} entries. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Wipe Everything", style: "destructive", onPress: () => { deleteAllEntries(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
      ]
    );
  };

  // ── Notifications ───────────────────────────────────────────────────────────
  const saveReminderTime = async () => {
    const [h, m] = timeInput.split(":").map(Number);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      Alert.alert("Invalid time", "Enter a valid 24h time, e.g. 20:00");
      return;
    }
    await updateSettings({ reminderHour: h, reminderMinute: m });
    if (settings.reminderEnabled) await scheduleNotification(h, m);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ── PIN ─────────────────────────────────────────────────────────────────────
  const handleSavePin = async () => {
    if (pinStep === "enter") {
      if (pinInput.length < 4) return;
      setPinConfirm("");
      setPinStep("confirm");
      return;
    }
    if (pinConfirm !== pinInput) {
      Alert.alert("PINs don't match", "Please try again.");
      setPinStep("enter");
      setPinInput("");
      setPinConfirm("");
      return;
    }
    await updateSettings({ pin: pinInput, lockEnabled: true });
    setShowPinSetup(false);
    setPinInput("");
    setPinConfirm("");
    setPinStep("enter");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ── Recovery codes ──────────────────────────────────────────────────────────
  const handleGenerateCodes = async () => {
    const codes = Array.from({ length: 8 }, () => generateRecoveryCode());
    const hashes = codes.map(hashCode);
    await updateSettings({ recoveryCodeHashes: hashes });
    setGeneratedCodes(codes);
    setShowCodes(true);
  };

  const autoLockLabel = AUTO_LOCK_OPTIONS.find((o) => o.value === settings.autoLockTimeout)?.label ?? "1 minute";

  // ── Profile derived values ──────────────────────────────────────────────────
  const profileDisplayName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
  const profileEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const profileInitials = profileDisplayName
    ? profileDisplayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : profileEmail.slice(0, 2).toUpperCase();
  const profileProviders = (user?.externalAccounts ?? []).map((a) => a.provider as string);
  const profileHasGoogle = profileProviders.some((p) => p.includes("google"));
  const profileHasApple = profileProviders.some((p) => p.includes("apple"));
  const profileProviderLabel = profileHasGoogle ? "Google" : profileHasApple ? "Apple" : "Email";
  const profileProviderColor = profileHasGoogle ? "#4285F4" : profileHasApple ? colors.foreground : "#a855f7";
  const profileLinkedCount = (profileHasGoogle ? 1 : 0) + (profileHasApple ? 1 : 0) + 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, borderBottomColor: colors.border }]}>
        {router.canGoBack() ? (
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="x" size={20} color={colors.foreground} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <Text style={[styles.title, { color: colors.foreground }]}>{t.settings.title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile card — always visible ────────────────────────────────── */}
        <View style={[profileSt.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {user ? (
            <>
              {/* Avatar */}
              <View style={profileSt.avatarWrap}>
                {user.imageUrl ? (
                  <Image source={{ uri: user.imageUrl }} style={profileSt.avatarImg} contentFit="cover" />
                ) : (
                  <View style={[profileSt.avatarFallback, { backgroundColor: "#a855f720" }]}>
                    <Text style={[profileSt.avatarInitials, { color: "#a855f7" }]}>{profileInitials}</Text>
                  </View>
                )}
                <View style={[profileSt.providerBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {profileHasGoogle ? (
                    <Text style={profileSt.providerIcon}>G</Text>
                  ) : profileHasApple ? (
                    <Feather name="smartphone" size={9} color={colors.foreground} />
                  ) : (
                    <Feather name="mail" size={9} color="#a855f7" />
                  )}
                </View>
              </View>

              {/* Name & email */}
              <View style={profileSt.info}>
                <Text style={[profileSt.name, { color: profileDisplayName ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
                  {profileDisplayName || "No name set"}
                </Text>
                <View style={profileSt.emailRow}>
                  <Text style={[profileSt.email, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {profileEmail}
                  </Text>
                  <View style={[profileSt.providerPill, { backgroundColor: profileProviderColor + "18", borderColor: profileProviderColor + "40" }]}>
                    <Text style={[profileSt.providerPillText, { color: profileProviderColor }]}>{profileProviderLabel}</Text>
                  </View>
                </View>
              </View>

              {/* Edit pencil */}
              <PressableScale
                onPress={() => { setEditFirstName(user.firstName ?? ""); setEditLastName(user.lastName ?? ""); setShowEditName(true); }}
                haptic="light"
                style={[profileSt.editBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <Feather name="edit-2" size={14} color={colors.mutedForeground} />
              </PressableScale>
            </>
          ) : (
            <>
              {/* Guest avatar */}
              <View style={[profileSt.avatarFallback, { backgroundColor: colors.muted }]}>
                <Feather name="user" size={24} color={colors.mutedForeground} />
              </View>
              <View style={profileSt.info}>
                <Text style={[profileSt.name, { color: colors.foreground }]}>Guest</Text>
                <Text style={[profileSt.email, { color: colors.mutedForeground }]}>Not signed in</Text>
              </View>
              <PressableScale
                onPress={() => router.replace("/(auth)/sign-in" as any)}
                haptic="medium"
                style={[profileSt.editBtn, { backgroundColor: "#a855f715", borderColor: "#a855f740" }]}
              >
                <Feather name="log-in" size={14} color="#a855f7" />
              </PressableScale>
            </>
          )}
        </View>

        {/* ── Profile section — always visible ─────────────────────────────── */}
        <Section title="Profile" delay={50}>
          {user ? (
            <>
              <SettingRow
                icon="user"
                label="Full Name"
                sublabel={profileDisplayName || "Tap to set your name"}
                onPress={() => { setEditFirstName(user.firstName ?? ""); setEditLastName(user.lastName ?? ""); setShowEditName(true); }}
              />
              <SettingRow
                icon="mail"
                label="Email Address"
                sublabel={profileEmail || "No email on file"}
                borderTop
              />
              <SettingRow
                icon="link"
                label="Connected Accounts"
                sublabel={`${profileLinkedCount} account${profileLinkedCount !== 1 ? "s" : ""} linked${profileHasGoogle ? " · Google" : ""}${profileHasApple ? " · Apple" : ""}`}
                borderTop
              />
              <SettingRow
                icon="log-out"
                label="Sign Out"
                sublabel="Sign out of your account on this device"
                onPress={handleSignOut}
                borderTop
              />
              <SettingRow
                icon="user-x"
                label="Delete Account"
                sublabel="Permanently remove your account and all data"
                onPress={handleRequestDeleteCode}
                danger
                borderTop
              />
            </>
          ) : (
            <>
              <SettingRow
                icon="log-in"
                label="Sign In"
                sublabel="Access your account and sync entries"
                onPress={() => router.replace("/(auth)/sign-in" as any)}
              />
              <SettingRow
                icon="user-plus"
                label="Create Account"
                sublabel="Free — your data stays private"
                onPress={() => router.replace("/(auth)/sign-up" as any)}
                borderTop
              />
            </>
          )}
        </Section>

        {/* Security */}
        <Section title={t.settings.sections.security} delay={100}>
          <SettingRow
            icon="lock"
            label="App Lock"
            sublabel={settings.lockEnabled ? `PIN set · Auto-lock: ${autoLockLabel}` : "Protect your entries with a PIN"}
            right={
              <SpringSwitch
                value={settings.lockEnabled}
                onValueChange={async (v) => {
                  if (v && !settings.pin) { setShowPinSetup(true); return; }
                  await updateSettings({ lockEnabled: v });
                  if (!v) lock();
                }}
                trackColor={{ false: colors.border, true: "#a855f7" }}
                thumbColor={colors.foreground}
              />
            }
          />
          {settings.lockEnabled && (
            <>
              <SettingRow icon="edit-2" label="Change PIN" onPress={() => { setPinInput(""); setPinConfirm(""); setPinStep("enter"); setShowPinSetup(true); }} borderTop />
              <SettingRow
                icon="clock"
                label="Auto-lock"
                sublabel={autoLockLabel}
                onPress={() => setShowAutoLock(true)}
                borderTop
              />
              <SettingRow
                icon="eye-off"
                label="Decoy PIN"
                sublabel={settings.decoyPin ? "Set — shows empty app" : "Set a second PIN that shows empty app"}
                onPress={() => { setDecoyPinInput(""); setShowDecoySetup(true); }}
                borderTop
              />
              <SettingRow
                icon="key"
                label="Recovery Codes"
                sublabel={settings.recoveryCodeHashes.length > 0 ? `${settings.recoveryCodeHashes.length} codes generated` : "Generate backup access codes"}
                onPress={handleGenerateCodes}
                borderTop
              />
            </>
          )}
        </Section>

        {/* Privacy */}
        <Section title={t.settings.sections.privacy} delay={150}>
          <SettingRow
            icon="camera-off"
            label="Strip Photo Metadata"
            sublabel="Remove GPS and EXIF data from photos"
            right={
              <SpringSwitch
                value={settings.stripMetadata}
                onValueChange={(v) => updateSettings({ stripMetadata: v })}
                trackColor={{ false: colors.border, true: "#a855f7" }}
                thumbColor={colors.foreground}
              />
            }
          />
          <SettingRow
            icon="wifi-off"
            label="Local-only Mode"
            sublabel={settings.localOnlyMode ? "Entries stay on device only" : "Sync to cloud enabled"}
            right={
              <SpringSwitch
                value={settings.localOnlyMode}
                onValueChange={(v) => updateSettings({ localOnlyMode: v })}
                trackColor={{ false: colors.border, true: "#a855f7" }}
                thumbColor={colors.foreground}
              />
            }
            borderTop
          />
          <SettingRow
            icon="image"
            label="Block Screenshots"
            sublabel="Prevent screenshots and recording, blur in app switcher"
            right={
              <SpringSwitch
                value={settings.screenshotProtection}
                onValueChange={(v) => updateSettings({ screenshotProtection: v })}
                trackColor={{ false: colors.border, true: "#a855f7" }}
                thumbColor={colors.foreground}
              />
            }
            borderTop
          />
          <SettingRow
            icon="zap"
            label="Shake to Lock"
            sublabel="Vigorously shake the device to lock instantly"
            right={
              <SpringSwitch
                value={settings.panicShakeEnabled}
                onValueChange={(v) => updateSettings({ panicShakeEnabled: v })}
                trackColor={{ false: colors.border, true: "#a855f7" }}
                thumbColor={colors.foreground}
              />
            }
            borderTop
          />
          <SettingRow
            icon="trash-2"
            label="Auto-wipe After Failures"
            sublabel={settings.wipeAfterFails > 0 ? `Erase all entries after ${settings.wipeAfterFails} wrong PINs` : "Disabled"}
            onPress={() => {
              const next = settings.wipeAfterFails === 0 ? 10 : settings.wipeAfterFails === 10 ? 20 : settings.wipeAfterFails === 20 ? 50 : 0;
              updateSettings({ wipeAfterFails: next });
            }}
            borderTop
          />
          <SettingRow
            icon="lock"
            label="Per-Entry Biometric Lock"
            sublabel="Lock individual entries — each requires fresh authentication"
            right={
              <SpringSwitch
                value={settings.perEntryLockEnabled}
                onValueChange={(v) => updateSettings({ perEntryLockEnabled: v })}
                trackColor={{ false: colors.border, true: "#a855f7" }}
                thumbColor={colors.foreground}
              />
            }
            borderTop
          />
          {/* #1 End-to-end encryption — uses the app PIN as a passphrase */}
          <SettingRow
            icon="shield"
            label="End-to-End Encryption"
            sublabel={
              settings.e2eEncryptionEnabled
                ? "Title and notes are encrypted before sync"
                : settings.lockEnabled
                  ? "Encrypt entries on the cloud with your PIN"
                  : "Set a PIN first to enable encryption"
            }
            right={
              <SpringSwitch
                value={settings.e2eEncryptionEnabled}
                onValueChange={async (v) => {
                  if (v && !settings.lockEnabled) {
                    Alert.alert("PIN required", "Enable App Lock with a PIN before turning on end-to-end encryption.");
                    return;
                  }
                  if (v) {
                    const salt = settings.encryptionSalt || generateSalt();
                    await updateSettings({ e2eEncryptionEnabled: true, encryptionSalt: salt });
                  } else {
                    Alert.alert(
                      "Disable encryption?",
                      "New entries will sync as plaintext. Existing encrypted entries on the server stay encrypted until re-saved.",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Disable", style: "destructive", onPress: () => updateSettings({ e2eEncryptionEnabled: false }) },
                      ],
                    );
                  }
                }}
                trackColor={{ false: colors.border, true: "#a855f7" }}
                thumbColor={colors.foreground}
              />
            }
            borderTop
          />
          {/* #18 Geo-tagging */}
          <SettingRow
            icon="map-pin"
            label="Location Tagging"
            sublabel={settings.geoTaggingEnabled ? "Optionally attach a place to new entries" : "Off"}
            right={
              <SpringSwitch
                value={settings.geoTaggingEnabled}
                onValueChange={(v) => updateSettings({ geoTaggingEnabled: v })}
                trackColor={{ false: colors.border, true: "#a855f7" }}
                thumbColor={colors.foreground}
              />
            }
            borderTop
          />
        </Section>

        {/* Browse */}
        <Section title="Browse" delay={200}>
          {/* #16 Memory threads */}
          <SettingRow
            icon="git-branch"
            label="Memory Threads"
            sublabel="Group related entries into clusters"
            onPress={() => router.push("/threads" as any)}
          />
          {/* #18 Map of places */}
          <SettingRow
            icon="map"
            label="Places"
            sublabel="Entries with a location attached"
            onPress={() => router.push("/places" as any)}
            borderTop
          />
          {/* #3/#4 Weekly digest + heatmap */}
          <SettingRow
            icon="bar-chart-2"
            label="Weekly Digest"
            sublabel="Stats, heatmap, mood and top words"
            onPress={() => router.push("/digest" as any)}
            borderTop
          />
          {/* #7 Trash */}
          <SettingRow
            icon="trash-2"
            label="Recently Deleted"
            sublabel={trashedEntries.length > 0 ? `${trashedEntries.length} item${trashedEntries.length === 1 ? "" : "s"} · auto-purged after 30d` : "Empty"}
            onPress={() => router.push("/trash" as any)}
            borderTop
          />
          {/* #10 Markdown export */}
          <SettingRow
            icon="file-text"
            label="Export as Markdown"
            sublabel={`${totalWords.toLocaleString()} total words across ${entries.length} entries`}
            onPress={handleExportMarkdown}
            borderTop
          />
        </Section>

        {/* Custom Tags */}
        <Section title="Tags" delay={250}>
          {(settings.customTags ?? []).map((tag, idx) => (
            <View key={tag.id} style={[styles.tagEditRow, { borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <Pressable
                onPress={() => {
                  const palette = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];
                  const cur = palette.indexOf(tag.color);
                  const next = palette[(cur + 1) % palette.length];
                  updateSettings({ customTags: settings.customTags.map((t) => (t.id === tag.id ? { ...t, color: next } : t)) });
                }}
                style={[styles.tagSwatch, { backgroundColor: tag.color }]}
              />
              <TextInput
                style={[styles.tagNameInput, { color: colors.foreground, borderColor: colors.border }]}
                value={tag.label}
                onFocus={() => { if (!originalTagLabelsRef.current.has(tag.id)) originalTagLabelsRef.current.set(tag.id, tag.label); }}
                onChangeText={(text) => {
                  if (!originalTagLabelsRef.current.has(tag.id)) originalTagLabelsRef.current.set(tag.id, tag.label);
                  updateSettings({ customTags: settings.customTags.map((t) => (t.id === tag.id ? { ...t, label: text } : t)) });
                }}
                onBlur={() => handleTagLabelCommit(tag.id, tag.label)}
                onSubmitEditing={() => handleTagLabelCommit(tag.id, tag.label)}
                maxLength={20}
              />
              <Pressable
                onPress={() => updateSettings({ customTags: settings.customTags.filter((t) => t.id !== tag.id) })}
                hitSlop={8}
              >
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ))}
          <Pressable
            style={[styles.addTagBtn, { borderTopColor: colors.border }]}
            onPress={() => {
              const id = `tag-${Date.now().toString(36)}`;
              updateSettings({ customTags: [...settings.customTags, { id, label: "New Tag", color: "#a855f7", icon: "tag" }] });
            }}
          >
            <Feather name="plus" size={14} color="#a855f7" />
            <Text style={[styles.addTagText, { color: "#a855f7" }]}>Add tag</Text>
          </Pressable>
          <Pressable
            style={[styles.addTagBtn, { borderTopColor: colors.border }]}
            onPress={() => updateSettings({ customTags: DEFAULT_TAGS_LIB })}
          >
            <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
            <Text style={[styles.addTagText, { color: colors.mutedForeground }]}>Reset to defaults</Text>
          </Pressable>
        </Section>

        {/* Appearance */}
        <Section title={t.settings.sections.appearance} delay={250}>
          {/* Inline theme segmented control — no modal needed */}
          <View style={[styles.themeRow, { borderBottomColor: colors.border }]}>
            <View style={styles.themeLabelSide}>
              <Feather name="moon" size={16} color={colors.mutedForeground} />
              <Text style={[styles.themeLabel, { color: colors.foreground }]}>Theme</Text>
            </View>
            <View style={[styles.segControl, { backgroundColor: colors.muted }]}>
              {([
                { key: "system", label: "System", icon: "smartphone" },
                { key: "light",  label: "Light",  icon: "sun" },
                { key: "dark",   label: "Dark",   icon: "moon" },
              ] as { key: "system" | "light" | "dark"; label: string; icon: string }[]).map((opt) => {
                const active = settings.appearanceMode === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      await updateSettings({ appearanceMode: opt.key });
                    }}
                    style={[
                      styles.segment,
                      active
                        ? { backgroundColor: colors.card, borderColor: "#a855f730" }
                        : { borderColor: "transparent" },
                    ]}
                  >
                    <Feather name={opt.icon as "moon" | "sun" | "smartphone"} size={13} color={active ? "#a855f7" : colors.mutedForeground} />
                    <Text style={[styles.segmentText, { color: active ? "#a855f7" : colors.mutedForeground }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <SettingRow
            icon="type"
            label="Font Color"
            sublabel={settings.fontColor || "Auto (follows theme)"}
            onPress={() => setShowFontColorPicker(true)}
            borderTop
          />
        </Section>

        {/* Language & Currency */}
        <Section title={t.settings.sections.language} delay={280}>
          <SettingRow
            icon="globe"
            label={t.settings.rows.appLanguage}
            sublabel={SUPPORTED_LANGUAGES.find((l) => l.value === settings.language)?.label ?? "English"}
            onPress={() => setShowLanguagePicker(true)}
          />
          <SettingRow
            icon="dollar-sign"
            label={t.settings.rows.currency}
            sublabel={SUPPORTED_CURRENCIES.find((c) => c.code === (settings.currency ?? "USD"))?.label ?? "US Dollar (USD)"}
            onPress={() => setShowCurrencyPicker(true)}
            borderTop
          />
          <SettingRow
            icon="clock"
            label="Time Zone"
            sublabel={settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
            onPress={() => setShowTimezonePicker(true)}
            borderTop
          />
          <SettingRow
            icon="map-pin"
            label="Home location"
            sublabel={
              composeHomeLocationLine(settings.homeCity ?? "", settings.homeCountry ?? "").trim() ||
              settings.homeLocation?.trim() ||
              "Not set"
            }
            onPress={() => setShowHomeLocationPicker(true)}
            borderTop
          />
        </Section>

        {/* Notifications */}
        <Section title={t.settings.sections.notifications} delay={300}>
          <SettingRow
            icon="bell"
            label="Daily Reminder"
            sublabel={settings.reminderEnabled ? `Daily at ${String(settings.reminderHour).padStart(2, "0")}:${String(settings.reminderMinute).padStart(2, "0")}` : "Off"}
            right={
              <SpringSwitch
                value={settings.reminderEnabled}
                onValueChange={async (v) => {
                  await updateSettings({ reminderEnabled: v });
                  if (v) await scheduleNotification(settings.reminderHour, settings.reminderMinute);
                  else await cancelNotifications();
                }}
                trackColor={{ false: colors.border, true: "#a855f7" }}
                thumbColor={colors.foreground}
              />
            }
          />
          {settings.reminderEnabled && (
            <View style={[styles.timeRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <Feather name="clock" size={16} color={colors.mutedForeground} />
              <Text style={[styles.timeLabel, { color: colors.foreground }]}>Reminder time</Text>
              <TextInput
                style={[styles.timeInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                value={timeInput}
                onChangeText={setTimeInput}
                placeholder="20:00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                onBlur={saveReminderTime}
              />
            </View>
          )}
        </Section>

        {/* Recurring prompts */}
        <Section title={t.settings.sections.recurringPrompts} delay={300}>
          {settings.recurringPrompts.map((p, i) => (
            <SettingRow
              key={p.id}
              icon="repeat"
              label={p.text}
              sublabel={p.enabled ? (p.id === "daily-memory" ? "Every day at 9 PM" : "Every Sunday at 8 PM") : undefined}
              borderTop={i > 0}
              right={
                <SpringSwitch
                  value={p.enabled}
                  onValueChange={async (v) => {
                    const next = settings.recurringPrompts.map((rp) => rp.id === p.id ? { ...rp, enabled: v } : rp);
                    await updateSettings({ recurringPrompts: next });
                    if (v) await schedulePromptNotification(p.id, p.text);
                    else await cancelPromptNotification(p.id);
                  }}
                  trackColor={{ false: colors.border, true: "#a855f7" }}
                  thumbColor={colors.foreground}
                />
              }
            />
          ))}
        </Section>

        {/* Backup & Restore */}
        <Section title={t.settings.sections.backup} delay={300}>
          <SettingRow icon="upload" label="Export Backup" sublabel="Share as plain JSON" onPress={handleExport} />
          <SettingRow
            icon="shield"
            label="Encrypted Export"
            sublabel={settings.backupPassphrase ? "Passphrase set" : "Set a passphrase first"}
            onPress={handleEncryptedExport}
            borderTop
          />
          <SettingRow
            icon="key"
            label={settings.backupPassphrase ? "Change Passphrase" : "Set Backup Passphrase"}
            sublabel="Used for encrypted exports and imports"
            onPress={() => { setPassphraseInput(settings.backupPassphrase); setShowPassphraseSetup(true); }}
            borderTop
          />
          <SettingRow icon="download" label="Import Backup" sublabel="Restore from JSON or encrypted backup" onPress={() => setShowImport(true)} borderTop />
        </Section>

        {/* Social Share */}
        <Section title={t.settings.sections.social} delay={300}>
          {socialLinks.map((item, index) => (
            <SettingRow
              key={item.label}
              icon="share-2"
              label={item.label}
              sublabel={item.sublabel}
              borderTop={index > 0}
              onPress={async () => {
                if (item.nativeShare) {
                  try {
                    await Share.share({
                      message: "Check out Receipts — a private journal for your life and proof.",
                      url: "https://receipts.app",
                    });
                  } catch {}
                } else if (item.url) {
                  try { await Linking.openURL(item.url); } catch {}
                }
              }}
            />
          ))}
        </Section>

        {/* Legal */}
        <Section title="LEGAL" delay={300}>
          <SettingRow
            icon="file-text"
            label="Privacy Policy"
            sublabel="How we handle your data"
            onPress={() => router.push("/privacy-policy" as any)}
          />
          <SettingRow
            icon="mail"
            label="Support"
            sublabel="Get help or send feedback"
            onPress={() => { Linking.openURL("mailto:receipts.support@gmail.com").catch(() => {}); }}
            borderTop
          />
        </Section>

        {/* Danger zone */}
        <Section title={t.settings.sections.danger} delay={300}>
          <SettingRow icon="trash-2" label={`Delete All ${entries.length} Entries`} onPress={handleWipeAll} danger />
        </Section>
      </ScrollView>

      {/* ── Delete account modal ───────────────────────────────────────────── */}
      <Modal visible={showDeleteFlow} transparent animationType="fade" onRequestClose={() => setShowDeleteFlow(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Confirm account deletion</Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              We sent a 6-digit code to {deleteTargetEmail ?? "your email"}. Enter it below to permanently delete your account and all data.
            </Text>
            <TextInput
              value={deleteEmailCode}
              onChangeText={(t) => setDeleteEmailCode(t.replace(/\D/g, "").slice(0, 6))}
              keyboardType="numeric"
              placeholder="123456"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.codeInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              maxLength={6}
              textAlign="center"
            />
            <Pressable onPress={handleDeleteAccount} disabled={deleteLoading || deleteEmailCode.length < 6}
              style={[styles.dangerBtn, { backgroundColor: deleteEmailCode.length >= 6 ? "#ef4444" : colors.border }]}>
              <Text style={styles.dangerBtnText}>{deleteLoading ? "Deleting..." : "Delete account"}</Text>
            </Pressable>
            <Pressable onPress={() => setShowDeleteFlow(false)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── PIN setup modal ────────────────────────────────────────────────── */}
      <Modal visible={showPinSetup} transparent animationType="fade" onRequestClose={() => setShowPinSetup(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {pinStep === "enter" ? "Set a PIN" : "Confirm PIN"}
            </Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              {pinStep === "enter" ? "Enter a 4–6 digit PIN to protect your entries." : "Re-enter your PIN to confirm."}
            </Text>
            <TextInput
              value={pinStep === "enter" ? pinInput : pinConfirm}
              onChangeText={pinStep === "enter" ? (t) => setPinInput(t.replace(/\D/g, "").slice(0, 6)) : (t) => setPinConfirm(t.replace(/\D/g, "").slice(0, 6))}
              keyboardType="numeric"
              secureTextEntry
              placeholder="• • • •"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.codeInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              maxLength={6}
              textAlign="center"
              autoFocus
            />
            <Pressable
              onPress={handleSavePin}
              disabled={(pinStep === "enter" ? pinInput : pinConfirm).length < 4}
              style={[styles.primaryBtn, { backgroundColor: "#a855f7", opacity: (pinStep === "enter" ? pinInput : pinConfirm).length < 4 ? 0.5 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>{pinStep === "enter" ? "Next" : "Set PIN"}</Text>
            </Pressable>
            <Pressable onPress={() => { setShowPinSetup(false); setPinInput(""); setPinConfirm(""); setPinStep("enter"); }}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Decoy PIN modal ────────────────────────────────────────────────── */}
      <Modal visible={showDecoySetup} transparent animationType="fade" onRequestClose={() => setShowDecoySetup(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Decoy PIN</Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              When unlocked with this PIN, the app shows as completely empty — no entries, nothing.{"\n\n"}
              Must be different from your main PIN.
            </Text>
            <TextInput
              value={decoyPinInput}
              onChangeText={(t) => setDecoyPinInput(t.replace(/\D/g, "").slice(0, 6))}
              keyboardType="numeric"
              secureTextEntry
              placeholder="• • • •"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.codeInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              maxLength={6}
              textAlign="center"
              autoFocus
            />
            {decoyPinInput.length >= 4 && decoyPinInput === settings.pin && (
              <Text style={{ color: "#ef4444", fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" }}>
                Must differ from your main PIN
              </Text>
            )}
            <Pressable
              onPress={async () => {
                if (decoyPinInput === settings.pin || decoyPinInput.length < 4) return;
                await updateSettings({ decoyPin: decoyPinInput });
                setShowDecoySetup(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              disabled={decoyPinInput.length < 4 || decoyPinInput === settings.pin}
              style={[styles.primaryBtn, { backgroundColor: "#a855f7", opacity: decoyPinInput.length < 4 || decoyPinInput === settings.pin ? 0.5 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>Save Decoy PIN</Text>
            </Pressable>
            {settings.decoyPin ? (
              <Pressable onPress={async () => { await updateSettings({ decoyPin: "" }); setShowDecoySetup(false); }}>
                <Text style={[styles.cancelText, { color: "#ef4444" }]}>Remove decoy PIN</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => setShowDecoySetup(false)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Auto-lock picker modal ─────────────────────────────────────────── */}
      <Modal visible={showAutoLock} transparent animationType="fade" onRequestClose={() => setShowAutoLock(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Auto-lock</Text>
            {AUTO_LOCK_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={async () => { await updateSettings({ autoLockTimeout: opt.value }); setShowAutoLock(false); }}
                style={[styles.optionRow, { borderColor: colors.border }]}
              >
                <Text style={[styles.optionLabel, { color: colors.foreground }]}>{opt.label}</Text>
                {settings.autoLockTimeout === opt.value && <Feather name="check" size={16} color="#a855f7" />}
              </Pressable>
            ))}
            <Pressable onPress={() => setShowAutoLock(false)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showFontColorPicker} transparent animationType="fade" onRequestClose={() => setShowFontColorPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Font Color</Text>
            <Pressable
              onPress={async () => {
                await updateSettings({ fontColor: "" });
                setShowFontColorPicker(false);
              }}
              style={[styles.optionRow, { borderColor: colors.border }]}
            >
              <View style={[styles.colorSwatch, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }]}>
                <Feather name="sun" size={11} color={colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.foreground }]}>Auto</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>Follows light / dark theme</Text>
              </View>
              {!settings.fontColor && <Feather name="check" size={16} color="#a855f7" />}
            </Pressable>
            {["#f0f0f0", "#111111", "#a855f7", "#3b82f6", "#22c55e", "#ef4444", "#f59e0b"].map((hex) => (
              <Pressable
                key={hex}
                onPress={async () => {
                  await updateSettings({ fontColor: hex });
                  setShowFontColorPicker(false);
                }}
                style={[styles.optionRow, { borderColor: colors.border }]}
              >
                <View style={[styles.colorSwatch, { backgroundColor: hex }]} />
                <Text style={[styles.optionLabel, { color: colors.foreground }]}>{hex}</Text>
                {settings.fontColor === hex && <Feather name="check" size={16} color="#a855f7" />}
              </Pressable>
            ))}
            <TextInput
              value={customFontColor}
              onChangeText={setCustomFontColor}
              placeholder="#e5e7eb"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.passphraseInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
            />
            <Pressable
              onPress={async () => {
                if (!/^#([0-9a-fA-F]{6})$/.test(customFontColor)) return;
                await updateSettings({ fontColor: customFontColor });
                setShowFontColorPicker(false);
                setCustomFontColor("");
              }}
              style={[styles.primaryBtn, { backgroundColor: "#a855f7" }]}
            >
              <Text style={styles.primaryBtnText}>Use custom color</Text>
            </Pressable>
            <Pressable onPress={() => setShowFontColorPicker(false)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowLanguagePicker(false); setLangSearch(""); }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.modalCardTall, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t.settings.language.title}</Text>
            <View style={[styles.langSearchWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="search" size={14} color={colors.mutedForeground} />
              <TextInput
                style={[styles.langSearchInput, { color: colors.foreground }]}
                placeholder="Search language..."
                placeholderTextColor={colors.mutedForeground}
                value={langSearch}
                onChangeText={setLangSearch}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {langSearch.length > 0 && Platform.OS !== "ios" && (
                <Pressable onPress={() => setLangSearch("")} hitSlop={8}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>
            <ScrollView
              style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}
              showsVerticalScrollIndicator
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {SUPPORTED_LANGUAGES.filter((l) =>
                l.label.toLowerCase().includes(langSearch.toLowerCase())
              ).map((language) => (
                <Pressable
                  key={language.value}
                  onPress={async () => {
                    await updateSettings({ language: language.value });
                    setShowLanguagePicker(false);
                    setLangSearch("");
                  }}
                  style={[styles.optionRow, { borderColor: colors.border }]}
                >
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>{language.label}</Text>
                  {settings.language === language.value && <Feather name="check" size={16} color="#a855f7" />}
                </Pressable>
              ))}
              {SUPPORTED_LANGUAGES.filter((l) =>
                l.label.toLowerCase().includes(langSearch.toLowerCase())
              ).length === 0 && (
                <View style={styles.noResultsWrap}>
                  <Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>No languages found</Text>
                </View>
              )}
            </ScrollView>
            <Pressable onPress={() => { setShowLanguagePicker(false); setLangSearch(""); }}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCurrencyPicker}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowCurrencyPicker(false); setCurrencySearch(""); }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.modalCardTall, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Currency</Text>
            <View style={[styles.langSearchWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="search" size={14} color={colors.mutedForeground} />
              <TextInput
                style={[styles.langSearchInput, { color: colors.foreground }]}
                placeholder="Search currency..."
                placeholderTextColor={colors.mutedForeground}
                value={currencySearch}
                onChangeText={setCurrencySearch}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {currencySearch.length > 0 && Platform.OS !== "ios" && (
                <Pressable onPress={() => setCurrencySearch("")} hitSlop={8}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>
            <ScrollView
              style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}
              showsVerticalScrollIndicator
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {SUPPORTED_CURRENCIES.filter((c) =>
                c.label.toLowerCase().includes(currencySearch.toLowerCase()) ||
                c.code.toLowerCase().includes(currencySearch.toLowerCase())
              ).map((currency) => (
                <Pressable
                  key={currency.code}
                  onPress={async () => {
                    await updateSettings({ currency: currency.code });
                    setShowCurrencyPicker(false);
                    setCurrencySearch("");
                  }}
                  style={[styles.optionRow, { borderColor: colors.border }]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={[styles.codeChip, { color: colors.mutedForeground, width: "auto" }]}>{currency.symbol}</Text>
                    <Text style={[styles.optionLabel, { color: colors.foreground }]}>{currency.label}</Text>
                  </View>
                  {(settings.currency ?? "USD") === currency.code && <Feather name="check" size={16} color="#a855f7" />}
                </Pressable>
              ))}
              {SUPPORTED_CURRENCIES.filter((c) =>
                c.label.toLowerCase().includes(currencySearch.toLowerCase()) ||
                c.code.toLowerCase().includes(currencySearch.toLowerCase())
              ).length === 0 && (
                <View style={styles.noResultsWrap}>
                  <Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>No currencies found</Text>
                </View>
              )}
            </ScrollView>
            <Pressable onPress={() => { setShowCurrencyPicker(false); setCurrencySearch(""); }}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Timezone picker modal ──────────────────────────────────────────── */}
      <Modal
        visible={showTimezonePicker}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowTimezonePicker(false); setTzSearch(""); }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.modalCardTall, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Time Zone</Text>
            <View style={[styles.langSearchWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="search" size={14} color={colors.mutedForeground} />
              <TextInput
                style={[styles.langSearchInput, { color: colors.foreground }]}
                placeholder="Search time zones…"
                placeholderTextColor={colors.mutedForeground}
                value={tzSearch}
                onChangeText={setTzSearch}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {tzSearch.length > 0 && Platform.OS !== "ios" && (
                <Pressable onPress={() => setTzSearch("")} hitSlop={8}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>
            <ScrollView
              style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}
              showsVerticalScrollIndicator
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Device default option */}
              {(tzSearch.length === 0 || "device default".includes(tzSearch.toLowerCase())) && (
                <Pressable
                  onPress={async () => { await updateSettings({ timezone: "" }); setShowTimezonePicker(false); setTzSearch(""); }}
                  style={[styles.optionRow, { borderColor: colors.border }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, { color: colors.foreground }]}>Device Default</Text>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>{Intl.DateTimeFormat().resolvedOptions().timeZone}</Text>
                  </View>
                  {!settings.timezone && <Feather name="check" size={16} color="#a855f7" />}
                </Pressable>
              )}
              {TIMEZONES.filter((tz) =>
                tz.toLowerCase().includes(tzSearch.toLowerCase())
              ).map((tz) => (
                <Pressable
                  key={tz}
                  onPress={async () => { await updateSettings({ timezone: tz }); setShowTimezonePicker(false); setTzSearch(""); }}
                  style={[styles.optionRow, { borderColor: colors.border }]}
                >
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>{tz.replace(/_/g, " ")}</Text>
                  {settings.timezone === tz && <Feather name="check" size={16} color="#a855f7" />}
                </Pressable>
              ))}
              {tzSearch.length > 0 && TIMEZONES.filter((tz) => tz.toLowerCase().includes(tzSearch.toLowerCase())).length === 0 && (
                <View style={styles.noResultsWrap}>
                  <Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>No time zones found</Text>
                </View>
              )}
            </ScrollView>
            <Pressable onPress={() => { setShowTimezonePicker(false); setTzSearch(""); }}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <HomeLocationPickerModal
        visible={showHomeLocationPicker}
        onClose={() => setShowHomeLocationPicker(false)}
        settings={settings}
        updateSettings={updateSettings}
        settingsLoaded={loaded}
      />

      {/* ── Recovery codes modal ───────────────────────────────────────────── */}
      <Modal visible={showCodes} transparent animationType="fade" onRequestClose={() => setShowCodes(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Recovery Codes</Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              Save these codes somewhere safe. Each can be used once to unlock the app if you forget your PIN.
            </Text>
            <View style={[styles.codesGrid, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              {generatedCodes.map((code) => (
                <Text key={code} style={[styles.codeChip, { color: colors.foreground }]}>{code}</Text>
              ))}
            </View>
            <Pressable
              onPress={async () => {
                try { await Share.share({ message: "Receipts recovery codes:\n\n" + generatedCodes.join("\n"), title: "Recovery Codes" }); } catch {}
              }}
              style={[styles.primaryBtn, { backgroundColor: "#a855f7" }]}
            >
              <Text style={styles.primaryBtnText}>Copy / Share codes</Text>
            </Pressable>
            <Pressable onPress={() => setShowCodes(false)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Done — I've saved them</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Backup passphrase modal ────────────────────────────────────────── */}
      <Modal visible={showPassphraseSetup} transparent animationType="fade" onRequestClose={() => setShowPassphraseSetup(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Backup Passphrase</Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              This passphrase encrypts your exported backups. You'll need it to import them again.
            </Text>
            <TextInput
              value={passphraseInput}
              onChangeText={setPassphraseInput}
              placeholder="Enter a strong passphrase"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              style={[styles.passphraseInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              autoFocus
            />
            <Pressable
              onPress={async () => {
                await updateSettings({ backupPassphrase: passphraseInput });
                setShowPassphraseSetup(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              disabled={passphraseInput.length < 4}
              style={[styles.primaryBtn, { backgroundColor: "#a855f7", opacity: passphraseInput.length < 4 ? 0.5 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>Save Passphrase</Text>
            </Pressable>
            <Pressable onPress={() => setShowPassphraseSetup(false)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Edit name modal ────────────────────────────────────────────────── */}
      <Modal visible={showEditName} transparent animationType="fade" onRequestClose={() => setShowEditName(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Edit Name</Text>
            <View style={{ gap: 10 }}>
              <TextInput
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholder="First name"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.passphraseInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                autoFocus
                returnKeyType="next"
              />
              <TextInput
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder="Last name"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.passphraseInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                returnKeyType="done"
                onSubmitEditing={handleUpdateName}
              />
            </View>
            <Pressable
              onPress={handleUpdateName}
              disabled={nameLoading}
              style={[styles.primaryBtn, { backgroundColor: "#a855f7", opacity: nameLoading ? 0.6 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>{nameLoading ? "Saving…" : "Save Name"}</Text>
            </Pressable>
            <Pressable onPress={() => setShowEditName(false)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Import modal ───────────────────────────────────────────────────── */}
      <Modal visible={showImport} transparent animationType="slide" onRequestClose={() => setShowImport(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Import Backup</Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              Paste your backup JSON below. Encrypted backups will be decrypted with your saved passphrase.
            </Text>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              placeholder='{"entries": [...]}'
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.importInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
            />
            <Pressable
              onPress={handleImport}
              disabled={importText.length < 2}
              style={[styles.primaryBtn, { backgroundColor: "#a855f7", opacity: importText.length < 2 ? 0.5 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>Import</Text>
            </Pressable>
            <Pressable onPress={() => { setShowImport(false); setImportText(""); }}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const profileSt = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarWrap: { position: "relative" },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 20, fontFamily: "Inter_700Bold" },
  providerBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  providerIcon: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#4285F4" },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontFamily: "Inter_700Bold" },
  emailRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  email: { fontSize: 12, fontFamily: "Inter_400Regular", flexShrink: 1 },
  providerPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  providerPillText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  scrollContent: { padding: 20, gap: 20 },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, paddingHorizontal: 4, marginTop: -12 },
  accountAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#a855f715", alignItems: "center", justifyContent: "center" },
  accountName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  accountEmail: { fontSize: 13, fontFamily: "Inter_400Regular" },
  profileHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  providerRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  providerBadge: { fontSize: 11, fontFamily: "Inter_400Regular" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  timeLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  timeInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, fontSize: 15, fontFamily: "Inter_700Bold", width: 72, textAlign: "center" },
  tagEditRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 11 },
  tagSwatch: { width: 22, height: 22, borderRadius: 11 },
  tagNameInput: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", paddingVertical: 6, paddingHorizontal: 10, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8 },
  addTagBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  addTagText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modalBackdrop: { flex: 1, backgroundColor: "#00000088", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 20, gap: 14 },
  modalCardTall: { maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalBody: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  codeInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 8 },
  passphraseInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: "Inter_500Medium" },
  importInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 13, fontFamily: "Inter_400Regular", minHeight: 100, textAlignVertical: "top" },
  dangerBtn: { borderRadius: 12, padding: 14, alignItems: "center" },
  dangerBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  primaryBtn: { borderRadius: 12, padding: 14, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  cancelText: { textAlign: "center", fontSize: 13, fontFamily: "Inter_500Medium" },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  optionLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  codesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  codeChip: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1, width: "46%", textAlign: "center", paddingVertical: 4 },
  colorSwatch: { width: 18, height: 18, borderRadius: 999 },
  themeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  themeLabelSide: { flexDirection: "row", alignItems: "center", gap: 12 },
  themeLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  segControl: { flexDirection: "row", borderRadius: 10, padding: 3, gap: 2 },
  segment: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  segmentText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  pickerWrap: { borderWidth: 1, borderRadius: 12, overflow: "hidden", maxHeight: 340 },
  langSearchWrap: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  langSearchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", padding: 0 },
  noResultsWrap: { paddingVertical: 20, alignItems: "center" },
  noResultsText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
