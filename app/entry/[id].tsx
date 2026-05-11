import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import { useAudioPlayer } from "expo-audio";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EntryShareCommentsPanel } from "@/components/EntryShareCommentsPanel";
import { AnimatedIconBounce } from "@/components/animations/AnimatedIconBounce";
import { PhotoHeroOverlay } from "@/components/PhotoHeroOverlay";
import { PinchZoomImageModal } from "@/components/PinchZoomImageModal";
import { PressableScale } from "@/components/PressableScale";
import { FadeInView } from "@/components/animations";
import { useEntries, type Entry, type Tag } from "@/context/EntriesContext";
import { useConsumedPhotoHero } from "@/context/PhotoHeroContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { entryToMarkdown, entryWordCount, readingTimeMinutes } from "@/lib/exportLib";
import { mergeNoteWithOcr, NOTE_MAX_LENGTH, runImageOcr } from "@/lib/imageOcr";
import { ENTRY_MOOD_EMOJIS } from "@/lib/entryMoodEmojis";
import { buildPublicEntryLink } from "@/lib/shareLink";
import { mergeTags, getTagColor } from "@/lib/tagsLib";

function AudioMemo({ uri, tagColor }: { uri: string; tagColor: string }) {
  const colors = useColors();
  const player = useAudioPlayer({ uri });
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    try {
      if (playing) { player.pause(); setPlaying(false); }
      else { player.seekTo(0); player.play(); setPlaying(true); }
    } catch { /* silent */ }
  };
  return (
    <Pressable onPress={toggle} style={[entryStyles.audioBar, { backgroundColor: tagColor + "12", borderColor: tagColor + "30" }]}>
      <View style={[entryStyles.audioPlay, { backgroundColor: tagColor }]}>
        <Feather name={playing ? "pause" : "play"} size={14} color="#000" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[entryStyles.audioTitle, { color: colors.foreground }]}>Voice memo</Text>
        <Text style={[entryStyles.audioSub, { color: colors.mutedForeground }]}>Tap to {playing ? "pause" : "play"}</Text>
      </View>
      <Feather name="mic" size={14} color={tagColor} />
    </Pressable>
  );
}

const entryStyles = StyleSheet.create({
  audioBar: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginTop: 12 },
  audioPlay: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  audioTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  audioSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
});

async function stripPhoto(uri: string, strip: boolean): Promise<string> {
  if (!strip) return uri;
  try {
    const r = await ImageManipulator.manipulateAsync(uri, [], { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG });
    return r.uri;
  } catch { return uri; }
}

function formatFullDate(dateStr: string, timezone?: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    ...(timezone ? { timeZone: timezone } : {}),
  };
  return new Date(dateStr).toLocaleString("default", opts);
}

function RelatedCard({ entry }: { entry: Entry }) {
  const colors = useColors();
  const { settings } = useSettings();
  const tagColor = getTagColor(entry.tag, settings.customTags);
  return (
    <PressableScale
      spring
      haptic="light"
      style={[relStyles.card, { backgroundColor: colors.muted, borderColor: tagColor + "30" }]}
      onPress={() => router.replace(`/entry/${entry.id}`)}
    >
      <View style={[relStyles.dot, { backgroundColor: tagColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={[relStyles.tag, { color: tagColor }]}>{entry.tag.toUpperCase()}</Text>
        <Text style={[relStyles.title, { color: colors.foreground }]} numberOfLines={1}>{entry.title}</Text>
      </View>
      <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
    </PressableScale>
  );
}

const ed2 = StyleSheet.create({
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  metaEmoji: { fontSize: 14 },
  metaText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  editMoodRow: { flexDirection: "row", gap: 8, marginTop: 12, alignSelf: "flex-start" },
  moodChip: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  moodEmoji: { fontSize: 20 },
});

const relStyles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tag: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  title: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 1 },
});

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { entries, updateEntry, deleteEntry, toggleStar, toggleLocked, linkEntries, unlinkEntries, findEntryById, togglePin, restoreEntry, permanentlyDelete, online } = useEntries();
  const { settings } = useSettings();

  // ── #5 Per-entry lock — biometric gate ──────────────────────────────────────
  // Fresh unlock state per entry id. Never auto-unlock on biometric errors.
  const [entryUnlocked, setEntryUnlocked] = useState(false);
  const requiresEntryLock = !!findEntryById(id)?.locked && settings.perEntryLockEnabled;

  // Reset unlock when navigating between entries.
  useEffect(() => { setEntryUnlocked(false); }, [id]);

  useEffect(() => {
    if (!requiresEntryLock || entryUnlocked) return;
    if (Platform.OS === "web") { setEntryUnlocked(true); return; } // web has no biometric API; rely on app-level PIN
    let cancelled = false;
    (async () => {
      try {
        const LA = require("expo-local-authentication");
        const hasHardware = await LA.hasHardwareAsync();
        const isEnrolled = await LA.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) return; // stay locked — user must use the manual unlock screen
        const result = await LA.authenticateAsync({ promptMessage: "Unlock this entry", fallbackLabel: "Cancel" });
        if (!cancelled && result.success) setEntryUnlocked(true);
      } catch { /* stay locked on any error */ }
    })();
    return () => { cancelled = true; };
  }, [id, requiresEntryLock, entryUnlocked]);

  const photoHeroPayload = useConsumedPhotoHero(id);
  const photoHeroDestRef = useRef<View>(null);
  const [photoHeroDismissed, setPhotoHeroDismissed] = useState(false);

  useEffect(() => {
    setPhotoHeroDismissed(false);
  }, [id]);

  const entry = findEntryById(id);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry?.title ?? "");
  const [editNote, setEditNote] = useState(entry?.note ?? "");
  const [editTag, setEditTag] = useState<Tag>(entry?.tag ?? "Memory");
  const [linkModal, setLinkModal] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [photoViewer, setPhotoViewer] = useState(false);
  const [editReceiptVendor, setEditReceiptVendor] = useState(entry?.receiptVendor ?? "");
  const [editReceiptAmount, setEditReceiptAmount] = useState(entry?.receiptAmount ?? "");
  const [editReceiptCurrency, setEditReceiptCurrency] = useState(entry?.receiptCurrency ?? "");
  const [editReceiptLocation, setEditReceiptLocation] = useState(entry?.receiptLocation ?? "");
  const [editReceiptDate, setEditReceiptDate] = useState(entry?.receiptDate ?? "");
  const [editReceiptExtra, setEditReceiptExtra] = useState(entry?.receiptExtra ?? "");
  const [editMood, setEditMood] = useState<string | null>(entry?.mood ?? null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const reducedMotionEntry = useReducedMotion();

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  if (!entry) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Entry not found</Text>
      </View>
    );
  }

  // Per-entry lock screen
  if (requiresEntryLock && !entryUnlocked) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset + 12, alignItems: "center", justifyContent: "center", gap: 14 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { position: "absolute", top: topInset + 10, left: 16 }]}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Feather name="lock" size={42} color={colors.mutedForeground} />
        <Text style={[styles.title, { color: colors.foreground, fontSize: 20 }]}>Entry locked</Text>
        <Text style={[styles.errorText, { color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 32 }]}>
          Authenticate to view this entry.
        </Text>
        <Pressable
          style={{ marginTop: 8, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 100, backgroundColor: colors.foreground }}
          onPress={async () => {
            try {
              const LA = require("expo-local-authentication");
              const hasHardware = await LA.hasHardwareAsync();
              const isEnrolled = await LA.isEnrolledAsync();
              if (!hasHardware || !isEnrolled) {
                // Device has no biometrics — fall back to the app-level PIN (already cleared
                // at app launch). Confirm by re-prompting via Alert before unlocking.
                Alert.alert("No biometrics", "This device has no biometrics enrolled. Unlock anyway?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Unlock", onPress: () => setEntryUnlocked(true) },
                ]);
                return;
              }
              const r = await LA.authenticateAsync({ promptMessage: "Unlock this entry" });
              if (r.success) setEntryUnlocked(true);
            } catch {}
          }}
        >
          <Text style={{ color: colors.background, fontFamily: "Inter_700Bold", fontSize: 14 }}>Authenticate</Text>
        </Pressable>
      </View>
    );
  }

  const tagColor = getTagColor(entry.tag, settings.customTags);
  const heroOverlayActive =
    !!photoHeroPayload &&
    !!entry.photoUri &&
    Platform.OS !== "web" &&
    !reducedMotionEntry &&
    !photoHeroDismissed &&
    !editing;
  const relatedEntries = (entry.relatedIds ?? []).map((rid) => entries.find((e) => e.id === rid)).filter(Boolean) as Entry[];
  const linkableEntries = entries.filter((e) => e.id !== entry.id && !(entry.relatedIds ?? []).includes(e.id));

  const handleSave = async () => {
    await updateEntry(entry.id, {
      title: editTitle,
      note: editNote,
      tag: editTag,
      receiptVendor: editReceiptVendor || undefined,
      receiptAmount: editReceiptAmount || undefined,
      receiptCurrency: editReceiptCurrency || undefined,
      receiptLocation: editReceiptLocation || undefined,
      receiptDate: editReceiptDate || undefined,
      receiptExtra: editReceiptExtra || undefined,
      mood: editMood ?? undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(false);
  };

  const handleDelete = () => {
    if (Platform.OS === "web") { deleteEntry(entry.id); router.back(); return; }
    Alert.alert("Delete Entry", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteEntry(entry.id); router.back(); } },
    ]);
  };

  const buildShareText = () => {
    const date = new Date(entry.createdAt).toLocaleDateString("default", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    const lines: string[] = [`[${entry.tag.toUpperCase()}] ${entry.title}`, date];
    if (entry.note) lines.push("", entry.note);
    if (entry.receiptVendor || entry.receiptAmount || entry.receiptLocation || entry.receiptDate) {
      lines.push("");
      lines.push(`Receipt${entry.receiptVendor ? ` · ${entry.receiptVendor}` : ""}`);
      if (entry.receiptAmount) lines.push(`Amount: ${entry.receiptAmount}${entry.receiptCurrency ? ` ${entry.receiptCurrency}` : ""}`);
      if (entry.receiptLocation) lines.push(`Location: ${entry.receiptLocation}`);
      if (entry.receiptDate) lines.push(`Date: ${entry.receiptDate}`);
    }
    const link = buildPublicEntryLink(entry.shareToken);
    if (entry.shareVisibility === "public" && link) lines.push("", link);
    lines.push("", "— Shared from Receipts");
    return lines.join("\n");
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowShareSheet(true);
  };

  const handleShareNative = async () => {
    setShowShareSheet(false);
    try { await Share.share({ message: buildShareText() }); } catch {}
  };

  // #10 Markdown export of this entry
  const handleExportMarkdown = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!entry) return;
    try { await Share.share({ message: entryToMarkdown(entry), title: `${entry.title || "Entry"}.md` }); } catch {}
  };

  // #6 Toggle pin
  const handleTogglePin = async () => {
    if (!entry) return;
    const r = await togglePin(entry.id);
    if (!r.ok && r.reason === "limit") {
      Alert.alert("Pin limit reached", "You can pin up to 5 entries. Unpin one first.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShareX = async () => {
    setShowShareSheet(false);
    const text = encodeURIComponent(`${entry.title} — recorded in Receipts`);
    try { await Linking.openURL(`https://x.com/intent/tweet?text=${text}`); } catch {}
  };

  const handleShareWhatsApp = async () => {
    setShowShareSheet(false);
    const text = encodeURIComponent(buildShareText());
    try { await Linking.openURL(`https://wa.me/?text=${text}`); } catch {}
  };

  const handleShareEmail = async () => {
    setShowShareSheet(false);
    const subject = encodeURIComponent(entry.title || "Receipts");
    const body = encodeURIComponent(buildShareText());
    try {
      await Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
    } catch { /* no mail client */ }
    Haptics.selectionAsync();
  };

  const handleShareSms = async () => {
    setShowShareSheet(false);
    const body = encodeURIComponent(buildShareText());
    const url = Platform.select({
      ios: `sms:&body=${body}`,
      android: `sms:?body=${body}`,
      default: `sms:?body=${body}`,
    });
    try {
      await Linking.openURL(url);
    } catch { /* no sms */ }
    Haptics.selectionAsync();
  };

  const handleCopyShareAll = async () => {
    await Clipboard.setStringAsync(buildShareText());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowShareSheet(false);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const uri = await stripPhoto(result.assets[0].uri, settings.stripMetadata);
      await updateEntry(entry.id, { photoUri: uri });
    }
  };

  const handleCameraPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const uri = await stripPhoto(result.assets[0].uri, settings.stripMetadata);
      await updateEntry(entry.id, { photoUri: uri });
    }
  };

  const appendOcrToNote = async (baseNote: string, apply: (merged: string) => void | Promise<void>) => {
    if (!entry.photoUri || ocrBusy) return;
    setOcrBusy(true);
    Haptics.selectionAsync();
    try {
      const { supported, text } = await runImageOcr(entry.photoUri);
      if (!supported) {
        Alert.alert(t.add.extractText, t.add.ocrUnavailable);
        return;
      }
      if (!text) {
        Alert.alert(t.add.extractText, t.add.ocrNothingFound);
        return;
      }
      const { text: merged, trimmed } = mergeNoteWithOcr(baseNote, text);
      await apply(merged);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (trimmed) Alert.alert(t.add.extractText, t.add.ocrNoteTrimmed);
    } catch {
      Alert.alert(t.common.error);
    } finally {
      setOcrBusy(false);
    }
  };

  return (
    <LinearGradient colors={[tagColor + "12", colors.background, colors.background]} locations={[0, 0.3, 1]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: topInset + 10, paddingBottom: bottomInset }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => { if (editing) setEditing(false); else router.back(); }} style={styles.iconBtn}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.topActions}>
            {!editing && entry.trashedAt && (
              <>
                <Pressable
                  onPress={async () => { await restoreEntry(entry.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back(); }}
                  style={[styles.saveBtn, { backgroundColor: "#22c55e" }]}
                >
                  <Text style={styles.saveBtnText}>Restore</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const go = async () => { await permanentlyDelete(entry.id); router.back(); };
                    if (Platform.OS === "web") return void go();
                    Alert.alert("Delete forever", "Permanently delete this entry?", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: go },
                    ]);
                  }}
                  style={styles.iconBtn}
                >
                  <Feather name="trash-2" size={18} color="#ef4444" />
                </Pressable>
              </>
            )}
            {!editing && !entry.trashedAt && (
              <>
                <AnimatedIconBounce onPress={() => { toggleStar(entry.id); }} style={styles.iconBtn}>
                  <Feather name="star" size={20} color={entry.starred ? "#f59e0b" : colors.mutedForeground} />
                </AnimatedIconBounce>
                <AnimatedIconBounce onPress={handleTogglePin} style={styles.iconBtn}>
                  <Feather name="bookmark" size={18} color={entry.pinned ? "#a855f7" : colors.mutedForeground} />
                </AnimatedIconBounce>
                {settings.perEntryLockEnabled && (
                  <AnimatedIconBounce onPress={() => { toggleLocked(entry.id); }} style={styles.iconBtn}>
                    <Feather name={entry.locked ? "lock" : "unlock"} size={18} color={entry.locked ? "#a855f7" : colors.mutedForeground} />
                  </AnimatedIconBounce>
                )}
                <Pressable onPress={handleShare} style={styles.iconBtn}>
                  <Feather name="share-2" size={18} color={colors.mutedForeground} />
                </Pressable>
                <Pressable onPress={handleExportMarkdown} style={styles.iconBtn}>
                  <Feather name="download" size={18} color={colors.mutedForeground} />
                </Pressable>
                <Pressable onPress={() => { setEditTitle(entry.title); setEditNote(entry.note); setEditTag(entry.tag); setEditReceiptVendor(entry.receiptVendor ?? ""); setEditReceiptAmount(entry.receiptAmount ?? ""); setEditReceiptCurrency(entry.receiptCurrency ?? ""); setEditReceiptLocation(entry.receiptLocation ?? ""); setEditReceiptDate(entry.receiptDate ?? ""); setEditReceiptExtra(entry.receiptExtra ?? ""); setEditMood(entry.mood ?? null); setEditing(true); }} style={styles.iconBtn}>
                  <Feather name="edit-2" size={18} color={colors.mutedForeground} />
                </Pressable>
                <Pressable onPress={handleDelete} style={styles.iconBtn}>
                  <Feather name="trash-2" size={18} color="#ef4444" />
                </Pressable>
              </>
            )}
            {editing && (
              <Pressable style={[styles.saveBtn, { backgroundColor: tagColor }]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Photo */}
          {entry.photoUri && (
            <>
              {heroOverlayActive && photoHeroPayload ? (
                <PhotoHeroOverlay
                  hero={photoHeroPayload}
                  destinationRef={photoHeroDestRef}
                  onComplete={() => setPhotoHeroDismissed(true)}
                />
              ) : null}
              <FadeInView
                delay={photoHeroPayload ? 0 : 50}
                from="bottom"
                distance={photoHeroPayload ? 2 : 10}
                spring={!photoHeroPayload}
              >
                <View style={{ gap: 10 }}>
                  <View
                    ref={photoHeroDestRef}
                    collapsable={false}
                    style={{ opacity: heroOverlayActive ? 0 : 1 }}
                  >
                    <Pressable
                      onPress={() => {
                        if (editing) void handlePickPhoto();
                        else setPhotoViewer(true);
                      }}
                    >
                      <Image source={{ uri: entry.photoUri }} style={styles.photo} contentFit="cover" accessibilityLabel={editing ? "Change photo" : "View photo full screen"} />
                      {editing && (
                        <View style={styles.photoOverlay}>
                          <Feather name="camera" size={20} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                  </View>
                  <Pressable
                    style={[styles.ocrBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                    disabled={ocrBusy}
                    onPress={() => {
                      if (editing) {
                        void appendOcrToNote(editNote, (m) => { setEditNote(m); });
                        return;
                      }
                      Alert.alert(t.add.ocrAppendTitle, t.add.ocrAppendBody, [
                        { text: t.common.cancel, style: "cancel" },
                        {
                          text: t.common.ok,
                          onPress: () => {
                            void appendOcrToNote(entry.note ?? "", (m) => updateEntry(entry.id, { note: m }));
                          },
                        },
                      ]);
                    }}
                  >
                    {ocrBusy ? (
                      <ActivityIndicator size="small" color={colors.mutedForeground} />
                    ) : (
                      <Feather name="type" size={15} color={colors.mutedForeground} />
                    )}
                    <Text style={[styles.photoBtnText, { color: colors.mutedForeground }]}>
                      {ocrBusy ? t.add.extractingText : t.add.extractText}
                    </Text>
                  </Pressable>
                </View>
              </FadeInView>
            </>
          )}

          {/* Tag row */}
          {editing ? (
            <View style={styles.tagRow}>
              {mergeTags(settings.customTags).map((tagDef) => {
                const t = tagDef.label;
                const c = tagDef.color;
                return (
                  <Pressable key={tagDef.id} onPress={() => setEditTag(t)}
                    style={[styles.tagChip, { backgroundColor: editTag === t ? c + "25" : colors.muted, borderColor: editTag === t ? c + "60" : "transparent", borderWidth: editTag === t ? 1 : 0 }]}>
                    <Text style={[styles.tagChipText, { color: editTag === t ? c : colors.mutedForeground }]}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.metaRow}>
              <View style={[styles.tagBadge, { backgroundColor: tagColor + "22" }]}>
                <View style={[styles.tagDot, { backgroundColor: tagColor }]} />
                <Text style={[styles.tagLabel, { color: tagColor }]}>{entry.tag.toUpperCase()}</Text>
              </View>
              {entry.starred && (
                <View style={[styles.starBadge, { backgroundColor: "#f59e0b22" }]}>
                  <Feather name="star" size={11} color="#f59e0b" />
                  <Text style={[styles.starText, { color: "#f59e0b" }]}>Starred</Text>
                </View>
              )}
              <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{formatFullDate(entry.createdAt, settings.timezone || undefined)}</Text>
            </View>
          )}

          {/* Title */}
          <FadeInView delay={120} from="bottom" distance={10} spring>
          {editing
            ? <TextInput style={[styles.editTitle, { color: colors.foreground }]} value={editTitle} onChangeText={setEditTitle} multiline autoFocus />
            : <Text style={[styles.title, { color: colors.foreground }]}>{entry.title}</Text>
          }
          </FadeInView>

          {/* Note */}
          {(entry.note || editing) && <View style={[styles.noteSeparator, { backgroundColor: colors.border }]} />}
          <FadeInView delay={180} from="bottom" distance={10} spring>
          {editing
            ? <TextInput style={[styles.editNote, { color: colors.foreground }]} value={editNote} onChangeText={setEditNote} multiline textAlignVertical="top" placeholder="Add a note..." placeholderTextColor={colors.mutedForeground} maxLength={NOTE_MAX_LENGTH} />
            : entry.note ? <Text style={[styles.note, { color: colors.foreground }]}>{entry.note}</Text> : null
          }
          </FadeInView>

          {/* #9 Voice memo playback */}
          {entry.audioUri && !editing && <AudioMemo uri={entry.audioUri} tagColor={tagColor} />}

          {/* Geo-tag — shown for GPS-tagged or manually-tagged places */}
          {!editing && (typeof entry.latitude === "number" || !!entry.place) && (
            <Pressable
              onPress={typeof entry.latitude === "number" ? () => {
                const url = Platform.select({
                  ios: `http://maps.apple.com/?ll=${entry.latitude},${entry.longitude}`,
                  android: `geo:${entry.latitude},${entry.longitude}`,
                  default: `https://www.google.com/maps?q=${entry.latitude},${entry.longitude}`,
                });
                if (url) Linking.openURL(url).catch(() => {});
              } : undefined}
              style={[styles.geoBadge, { backgroundColor: tagColor + "18", borderColor: tagColor + "40" }]}
            >
              <Feather name="map-pin" size={13} color={tagColor} />
              <Text style={[styles.geoBadgeText, { color: tagColor }]} numberOfLines={1}>
                {entry.place ?? (typeof entry.latitude === "number" ? `${entry.latitude.toFixed(4)}, ${entry.longitude!.toFixed(4)}` : "")}
              </Text>
              {typeof entry.latitude === "number" && (
                <Feather name="external-link" size={11} color={tagColor + "aa"} />
              )}
            </Pressable>
          )}

          {/* #5 Mood + #9 Word count / read time */}
          {!editing && (
            <View style={ed2.metaRow}>
              {entry.mood ? (
                <View style={[ed2.metaChip, { backgroundColor: tagColor + "14", borderColor: tagColor + "35" }]}>
                  <Text style={ed2.metaEmoji}>{entry.mood}</Text>
                </View>
              ) : null}
              <View style={[ed2.metaChip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="type" size={11} color={colors.mutedForeground} />
                <Text style={[ed2.metaText, { color: colors.mutedForeground }]}>
                  {entryWordCount(entry).toLocaleString()} words · {readingTimeMinutes(`${entry.title} ${entry.note ?? ""}`)} min read
                </Text>
              </View>
              {entry.pinned ? (
                <View style={[ed2.metaChip, { backgroundColor: "#a855f714", borderColor: "#a855f740" }]}>
                  <Feather name="bookmark" size={11} color="#a855f7" />
                  <Text style={[ed2.metaText, { color: "#a855f7" }]}>Pinned</Text>
                </View>
              ) : null}
            </View>
          )}
          {editing && (
            <View style={ed2.editMoodRow}>
              {ENTRY_MOOD_EMOJIS.map((m) => {
                const active = editMood === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => { setEditMood(active ? null : m); Haptics.selectionAsync(); }}
                    style={[ed2.moodChip, { backgroundColor: active ? tagColor + "22" : colors.muted, borderColor: active ? tagColor : "transparent" }]}
                  >
                    <Text style={ed2.moodEmoji}>{m}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Receipt details */}
          {!editing && (entry.receiptVendor || entry.receiptAmount || entry.receiptLocation || entry.receiptDate) && (
            <FadeInView delay={360} from="bottom" distance={12} spring>
            <View style={[styles.receiptCard, { backgroundColor: tagColor + "0d", borderColor: tagColor + "30" }]}>
              <View style={styles.receiptHeader}>
                <Feather name="file-text" size={12} color={tagColor} />
                <Text style={[styles.receiptHeaderLabel, { color: tagColor }]}>RECEIPT DETAILS</Text>
              </View>
              <View style={styles.receiptRows}>
                {entry.receiptVendor ? (
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptFieldLabel, { color: colors.mutedForeground }]}>Vendor</Text>
                    <Text style={[styles.receiptFieldValue, { color: colors.foreground }]}>{entry.receiptVendor}</Text>
                  </View>
                ) : null}
                {entry.receiptAmount ? (
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptFieldLabel, { color: colors.mutedForeground }]}>Amount</Text>
                    <Text style={[styles.receiptFieldValue, { color: tagColor }]}>
                      {entry.receiptAmount}{entry.receiptCurrency ? ` ${entry.receiptCurrency}` : ""}
                    </Text>
                  </View>
                ) : null}
                {entry.receiptLocation ? (
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptFieldLabel, { color: colors.mutedForeground }]}>Location</Text>
                    <Text style={[styles.receiptFieldValue, { color: colors.foreground }]}>{entry.receiptLocation}</Text>
                  </View>
                ) : null}
                {entry.receiptDate ? (
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptFieldLabel, { color: colors.mutedForeground }]}>Date</Text>
                    <Text style={[styles.receiptFieldValue, { color: colors.foreground }]}>{entry.receiptDate}</Text>
                  </View>
                ) : null}
                {entry.receiptExtra ? (
                  <View style={[styles.receiptRow, { alignItems: "flex-start" }]}>
                    <Text style={[styles.receiptFieldLabel, { color: colors.mutedForeground }]}>Notes</Text>
                    <Text style={[styles.receiptFieldValue, { color: colors.foreground, textAlign: "right" }]}>{entry.receiptExtra}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            </FadeInView>
          )}

          {/* Receipt edit in edit mode */}
          {editing && (
            <View style={[styles.receiptEditCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <View style={styles.receiptHeader}>
                <Feather name="file-text" size={12} color={colors.mutedForeground} />
                <Text style={[styles.receiptHeaderLabel, { color: colors.mutedForeground }]}>RECEIPT DETAILS</Text>
              </View>

              {/* Vendor */}
              <View style={styles.receiptEditField}>
                <Text style={[styles.receiptEditLabel, { color: colors.mutedForeground }]}>VENDOR</Text>
                <TextInput
                  style={[styles.receiptEditInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={editReceiptVendor}
                  onChangeText={setEditReceiptVendor}
                  placeholder="e.g. Starbucks"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              {/* Amount + Currency side by side */}
              <View style={styles.receiptEditRow}>
                <View style={[styles.receiptEditField, { flex: 2 }]}>
                  <Text style={[styles.receiptEditLabel, { color: colors.mutedForeground }]}>AMOUNT</Text>
                  <TextInput
                    style={[styles.receiptEditInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    value={editReceiptAmount}
                    onChangeText={setEditReceiptAmount}
                    placeholder="e.g. 12.50"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.receiptEditField, { flex: 1 }]}>
                  <Text style={[styles.receiptEditLabel, { color: colors.mutedForeground }]}>CURRENCY</Text>
                  <TextInput
                    style={[styles.receiptEditInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    value={editReceiptCurrency}
                    onChangeText={(t) => setEditReceiptCurrency(t.toUpperCase().slice(0, 3))}
                    placeholder="USD"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="characters"
                    maxLength={3}
                  />
                </View>
              </View>

              {/* Location */}
              <View style={styles.receiptEditField}>
                <Text style={[styles.receiptEditLabel, { color: colors.mutedForeground }]}>LOCATION</Text>
                <TextInput
                  style={[styles.receiptEditInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={editReceiptLocation}
                  onChangeText={setEditReceiptLocation}
                  placeholder="e.g. New York, NY"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              {/* Date */}
              <View style={styles.receiptEditField}>
                <Text style={[styles.receiptEditLabel, { color: colors.mutedForeground }]}>DATE</Text>
                <TextInput
                  style={[styles.receiptEditInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={editReceiptDate}
                  onChangeText={setEditReceiptDate}
                  placeholder="e.g. 2024-03-15"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              {/* Extra / Notes */}
              <View style={styles.receiptEditField}>
                <Text style={[styles.receiptEditLabel, { color: colors.mutedForeground }]}>NOTES / EXTRA INFO</Text>
                <TextInput
                  style={[styles.receiptEditInput, styles.receiptEditInputMulti, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={editReceiptExtra}
                  onChangeText={setEditReceiptExtra}
                  placeholder="e.g. Transaction #TXN-0042, ref code, warranty info…"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {/* Photo add in edit mode */}
          {editing && !entry.photoUri && (
            <View style={styles.photoAttachRow}>
              <Pressable style={[styles.photoAttachBtn, { backgroundColor: colors.muted }]} onPress={() => void handlePickPhoto()}>
                <Feather name="image" size={15} color={colors.mutedForeground} />
                <Text style={[styles.photoBtnText, { color: colors.mutedForeground }]}>{t.add.gallery}</Text>
              </Pressable>
              <Pressable style={[styles.photoAttachBtn, { backgroundColor: colors.muted }]} onPress={() => void handleCameraPhoto()}>
                <Feather name="camera" size={15} color={colors.mutedForeground} />
                <Text style={[styles.photoBtnText, { color: colors.mutedForeground }]}>{t.add.camera}</Text>
              </Pressable>
            </View>
          )}

          {/* Public link, privacy, comments (owner) */}
          {!editing && !entry.trashedAt && (
            <EntryShareCommentsPanel
              entry={entry}
              online={online}
              tagColor={tagColor}
              onPatch={(u) => updateEntry(entry.id, u)}
            />
          )}

          {/* Share this entry */}
          {!editing && (
            <Pressable
              style={[styles.shareEntryBtn, { backgroundColor: tagColor + "14", borderColor: tagColor + "35" }]}
              onPress={handleShare}
            >
              <Feather name="share-2" size={15} color={tagColor} />
              <Text style={[styles.shareEntryText, { color: tagColor }]}>Share this entry</Text>
            </Pressable>
          )}

          {/* Related entries */}
          {!editing && (
            <FadeInView delay={420} from="bottom" distance={12} spring>
            <View style={styles.relatedSection}>
              <View style={styles.relatedHeader}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RELATED ENTRIES</Text>
                <Pressable onPress={() => setLinkModal(true)} style={[styles.linkBtn, { backgroundColor: colors.muted }]}>
                  <Feather name="link" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.linkBtnText, { color: colors.mutedForeground }]}>Link</Text>
                </Pressable>
              </View>
              {relatedEntries.length === 0
                ? <Text style={[styles.emptyRelated, { color: colors.mutedForeground }]}>No linked entries yet</Text>
                : relatedEntries.map((e) => (
                  <View key={e.id}>
                    <RelatedCard entry={e} />
                    <Pressable onPress={() => unlinkEntries(entry.id, e.id)} style={styles.unlinkBtn}>
                      <Text style={[styles.unlinkText, { color: colors.mutedForeground }]}>Unlink</Text>
                    </Pressable>
                  </View>
                ))
              }
            </View>
            </FadeInView>
          )}
        </ScrollView>
      </View>

      <PinchZoomImageModal
        uri={entry.photoUri ?? null}
        visible={photoViewer && !!entry.photoUri}
        onClose={() => setPhotoViewer(false)}
      />

      {/* Share sheet */}
      <Modal visible={showShareSheet} transparent animationType="slide" onRequestClose={() => setShowShareSheet(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowShareSheet(false)} />
          <View style={[styles.modalSheet, { backgroundColor: "#0f0f0f", borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Share Entry</Text>

            {/* Preview card */}
            <View style={[styles.sharePreview, { backgroundColor: colors.muted, borderColor: tagColor + "30" }]}>
              <View style={[styles.tagBadge, { backgroundColor: tagColor + "22", alignSelf: "flex-start" }]}>
                <View style={[styles.tagDot, { backgroundColor: tagColor }]} />
                <Text style={[styles.tagLabel, { color: tagColor }]}>{entry.tag.toUpperCase()}</Text>
              </View>
              <Text style={[styles.sharePreviewTitle, { color: colors.foreground }]} numberOfLines={2}>{entry.title}</Text>
              {entry.note ? (
                <Text style={[styles.sharePreviewNote, { color: colors.mutedForeground }]} numberOfLines={3}>{entry.note}</Text>
              ) : null}
              <Text style={[styles.sharePreviewFooter, { color: colors.mutedForeground }]}>— Shared from Receipts</Text>
            </View>

            {/* Share options */}
            <View style={styles.shareOptions}>
              <Pressable style={[styles.shareOption, { backgroundColor: colors.muted }]} onPress={handleShareX}>
                <Text style={[styles.shareOptionIcon, { color: colors.foreground }]}>𝕏</Text>
                <Text style={[styles.shareOptionLabel, { color: colors.foreground }]}>Post to X</Text>
                <Text style={[styles.shareOptionSub, { color: colors.mutedForeground }]}>Post to your profile</Text>
              </Pressable>

              <Pressable style={[styles.shareOption, { backgroundColor: colors.muted }]} onPress={handleShareWhatsApp}>
                <Feather name="message-circle" size={20} color="#22c55e" />
                <Text style={[styles.shareOptionLabel, { color: colors.foreground }]}>WhatsApp</Text>
                <Text style={[styles.shareOptionSub, { color: colors.mutedForeground }]}>Send to a contact</Text>
              </Pressable>

              <Pressable style={[styles.shareOption, { backgroundColor: colors.muted }]} onPress={handleShareEmail}>
                <Feather name="mail" size={20} color={colors.foreground} />
                <Text style={[styles.shareOptionLabel, { color: colors.foreground }]}>Email</Text>
                <Text style={[styles.shareOptionSub, { color: colors.mutedForeground }]}>Open your mail app</Text>
              </Pressable>

              <Pressable style={[styles.shareOption, { backgroundColor: colors.muted }]} onPress={handleShareSms}>
                <Feather name="message-square" size={20} color={colors.foreground} />
                <Text style={[styles.shareOptionLabel, { color: colors.foreground }]}>Messages / SMS</Text>
                <Text style={[styles.shareOptionSub, { color: colors.mutedForeground }]}>Text the entry</Text>
              </Pressable>

              <Pressable style={[styles.shareOption, { backgroundColor: colors.muted }]} onPress={handleCopyShareAll}>
                <Feather name="clipboard" size={20} color={colors.mutedForeground} />
                <Text style={[styles.shareOptionLabel, { color: colors.foreground }]}>Copy all</Text>
                <Text style={[styles.shareOptionSub, { color: colors.mutedForeground }]}>Title, note, receipt + link</Text>
              </Pressable>

              <Pressable style={[styles.shareOption, { backgroundColor: colors.muted }]} onPress={handleShareNative}>
                <Feather name="share-2" size={20} color={colors.mutedForeground} />
                <Text style={[styles.shareOptionLabel, { color: colors.foreground }]}>More options</Text>
                <Text style={[styles.shareOptionSub, { color: colors.mutedForeground }]}>Instagram, copy & more</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => setShowShareSheet(false)} style={styles.shareCancelBtn}>
              <Text style={[styles.shareCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Link modal */}
      <Modal visible={linkModal} transparent animationType="slide" onRequestClose={() => setLinkModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLinkModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: "#0f0f0f", borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Link an Entry</Text>
            {linkableEntries.length === 0
              ? <Text style={[styles.emptyRelated, { color: colors.mutedForeground }]}>No other entries to link</Text>
              : (
                <FlatList
                  data={linkableEntries}
                  keyExtractor={(e) => e.id}
                  style={{ maxHeight: 360 }}
                  renderItem={({ item }) => {
                    const tc = getTagColor(item.tag, settings.customTags);
                    return (
                      <Pressable style={[styles.linkItem, { borderColor: colors.border }]} onPress={() => { linkEntries(entry.id, item.id); setLinkModal(false); }}>
                        <View style={[relStyles.dot, { backgroundColor: tc }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[relStyles.tag, { color: tc }]}>{item.tag.toUpperCase()}</Text>
                          <Text style={[relStyles.title, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
                        </View>
                        <Feather name="plus" size={16} color={colors.mutedForeground} />
                      </Pressable>
                    );
                  }}
                />
              )
            }
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 2 },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 100 },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#000" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  photo: { width: "100%", height: 220, borderRadius: 16 },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 16, alignItems: "center", justifyContent: "center" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 },
  tagChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  tagBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  starBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 100 },
  starText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  dateText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5, lineHeight: 30 },
  editTitle: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5, lineHeight: 30, padding: 0 },
  noteSeparator: { height: 1, width: 32 },
  geoBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, marginTop: 12, maxWidth: "100%" },
  geoBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", flexShrink: 1 },
  note: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 26 },
  editNote: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 26, minHeight: 100, padding: 0 },
  photoAttachRow: { flexDirection: "row", gap: 10 },
  photoAttachBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 14 },
  photoBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  ocrBtn: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth },
  relatedSection: { gap: 10, paddingTop: 8 },
  relatedHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  linkBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyRelated: { fontSize: 13, fontFamily: "Inter_400Regular" },
  unlinkBtn: { alignSelf: "flex-end", marginTop: -4, marginBottom: 4 },
  unlinkText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 40 },
  backBtn: { margin: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: StyleSheet.hairlineWidth, padding: 24, gap: 16 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  linkItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  receiptCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 12 },
  receiptHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  receiptHeaderLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  receiptRows: { gap: 10 },
  receiptRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  receiptFieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  receiptFieldValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right", flexShrink: 1 },
  receiptEditCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 14 },
  receiptEditRow: { flexDirection: "row", gap: 10 },
  receiptEditField: { gap: 5 },
  receiptEditLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  receiptEditInput: { fontSize: 15, fontFamily: "Inter_400Regular", borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  receiptEditInputMulti: { minHeight: 72, paddingTop: 10 },
  shareEntryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14, borderWidth: 1 },
  shareEntryText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sharePreview: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 8 },
  sharePreviewTitle: { fontSize: 16, fontFamily: "Inter_700Bold", lineHeight: 22 },
  sharePreviewNote: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  sharePreviewFooter: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  shareOptions: { gap: 8 },
  shareOption: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14 },
  shareOptionIcon: { fontSize: 18, fontFamily: "Inter_700Bold", width: 20, textAlign: "center" },
  shareOptionLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  shareOptionSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  shareCancelBtn: { alignItems: "center", paddingVertical: 10 },
  shareCancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
