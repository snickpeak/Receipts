import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as LegacyFileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { useAudioRecorder, AudioModule, RecordingPresets } from "expo-audio";
import * as Location from "expo-location";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEntries, type Tag } from "@/context/EntriesContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/hooks/useTranslation";
import { TEMPLATES } from "@/constants/templates";
import { ENTRY_MOOD_EMOJIS } from "@/lib/entryMoodEmojis";
import { mergeTags, getTagColor } from "@/lib/tagsLib";
import { mergeNoteWithOcr, runImageOcr, NOTE_MAX_LENGTH } from "@/lib/imageOcr";
import { FadeInView, PulseView } from "@/components/animations";

type SpeechRecognitionInstance = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: any) => void) | null;
  onerror: (() => void) | null; onend: (() => void) | null;
  start: () => void; stop: () => void;
};

function getWebRecognition(): SpeechRecognitionInstance | null {
  if (Platform.OS !== "web") return null;
  try {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = "en-US"; r.continuous = false; r.interimResults = false;
    return r as SpeechRecognitionInstance;
  } catch { return null; }
}

async function stripPhoto(uri: string, strip: boolean): Promise<string> {
  if (!strip) return uri;
  try {
    const r = await ImageManipulator.manipulateAsync(uri, [], { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG });
    return r.uri;
  } catch { return uri; }
}

function AnimatedTagChip({ isSelected, color, icon, label, mutedBg, mutedFg, onPress }: { isSelected: boolean; color: string; icon: string; label: string; mutedBg: string; mutedFg: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <Pressable onPress={() => {
        scale.value = withSequence(withTiming(0.88, { duration: 80 }), withSpring(1, { damping: 12, stiffness: 200 }));
        onPress();
      }}
        style={[styles.tagChip, { backgroundColor: isSelected ? color + "25" : mutedBg, borderColor: isSelected ? color + "60" : "transparent", borderWidth: isSelected ? 1 : 0 }]}>
        <Feather name={icon as any} size={14} color={isSelected ? color : mutedFg} />
        <Text style={[styles.tagChipText, { color: isSelected ? color : mutedFg }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function MoodButton({ emoji, active, tagColor, mutedBg, onPress }: { emoji: string; active: boolean; tagColor: string; mutedBg: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => {
          scale.value = withSequence(withTiming(1.3, { duration: 100 }), withSpring(1, { damping: 8, stiffness: 200 }));
          onPress();
        }}
        style={[styles.moodChip, { backgroundColor: active ? tagColor + "22" : mutedBg, borderColor: active ? tagColor : "transparent" }]}
      >
        <Text style={styles.moodEmoji}>{emoji}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function AddEntryScreen() {
  const colors = useColors();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { addEntry } = useEntries();
  const { settings } = useSettings();
  const noteRef = useRef<TextInput>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const params = useLocalSearchParams<{ prompt?: string; tag?: string }>();

  const [title, setTitle] = useState(params.prompt ?? "");
  const [note, setNote] = useState("");
  const [selectedTag, setSelectedTag] = useState<Tag>((params.tag as Tag) ?? "Memory");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  // #9 Voice memo persistence
  const [audioUri, setAudioUri] = useState<string | null>(null);
  // #5 Mood picker — single emoji
  const [mood, setMood] = useState<string | null>(null);
  // Location tagging — GPS capture or manual text, always available
  const [geo, setGeo] = useState<{ latitude: number; longitude: number; place?: string } | null>(null);
  const [capturingGeo, setCapturingGeo] = useState(false);
  const [manualPlace, setManualPlace] = useState("");
  const [showPlaceInput, setShowPlaceInput] = useState(false);

  const captureGeo = async () => {
    if (capturingGeo) return;
    setCapturingGeo(true);
    Haptics.selectionAsync();
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let place: string | undefined;
      try {
        const rev = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        const r = rev[0];
        if (r) place = [r.name, r.city ?? r.region, r.country].filter(Boolean).join(", ");
      } catch { /* offline reverse geocode is fine to skip */ }
      setGeo({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, place });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { /* silent */ }
    finally { setCapturingGeo(false); }
  };

  // Date picker — defaults to today, allows backdating
  const [entryDate, setEntryDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const isToday = entryDate.getTime() === today.getTime();

  const formatEntryDate = (d: Date): string => {
    const t = new Date(); t.setHours(12, 0, 0, 0);
    const y = new Date(t); y.setDate(t.getDate() - 1);
    if (d.getTime() === t.getTime()) return "Today";
    if (d.getTime() === y.getTime()) return "Yesterday";
    return d.toLocaleDateString("default", { weekday: "short", month: "short", day: "numeric" });
  };

  const shiftDate = (days: number) => {
    const next = new Date(entryDate);
    next.setDate(next.getDate() + days);
    next.setHours(12, 0, 0, 0);
    const t = new Date(); t.setHours(12, 0, 0, 0);
    if (next > t) return; // can't go into the future
    setEntryDate(next);
    Haptics.selectionAsync();
  };

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const canSave = title.trim().length > 0;
  const TAGS = mergeTags(settings.customTags);
  const tagColor = getTagColor(selectedTag, settings.customTags);

  const handleTemplate = (tpl: (typeof TEMPLATES)[0]) => {
    setSelectedTag(tpl.tag);
    setTitle(tpl.titlePrefix);
    Haptics.selectionAsync();
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const uri = await stripPhoto(result.assets[0].uri, settings.stripMetadata);
      setPhotoUri(uri);
    }
  };


  const handleCameraPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const uri = await stripPhoto(result.assets[0].uri, settings.stripMetadata);
      setPhotoUri(uri);
    }
  };

  const handleOcrPhoto = async () => {
    if (!photoUri || ocrBusy) return;
    setOcrBusy(true);
    Haptics.selectionAsync();
    try {
      const { supported, text } = await runImageOcr(photoUri);
      if (!supported) {
        Alert.alert(t.add.extractText, t.add.ocrUnavailable);
        return;
      }
      if (!text) {
        Alert.alert(t.add.extractText, t.add.ocrNothingFound);
        return;
      }
      const { text: merged, trimmed } = mergeNoteWithOcr(note, text);
      setNote(merged);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (trimmed) Alert.alert(t.add.extractText, t.add.ocrNoteTrimmed);
    } catch {
      Alert.alert(t.common.error);
    } finally {
      setOcrBusy(false);
    }
  };

  // ── Voice: web (Web Speech API) ─────────────────────────────────────────────
  const handleVoiceWeb = () => {
    const recognition = getWebRecognition();
    if (!recognition) return;
    if (listening) { recognition.stop(); setListening(false); return; }
    setListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript as string;
      if (!title) setTitle(transcript);
      else setNote((n) => n ? n + " " + transcript : transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // ── Voice: native (expo-audio — attaches memo only, no cloud transcription) ─
  const handleVoiceNative = async () => {
    if (listening) {
      setListening(false);
      try {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        if (!uri) return;
        let persistedUri = uri;
        try {
          const docDir = LegacyFileSystem.documentDirectory;
          if (Platform.OS !== "web" && docDir) {
            const ext = uri.split(".").pop()?.toLowerCase() ?? "m4a";
            const dest = `${docDir}voice-memo-${Date.now()}.${ext}`;
            await LegacyFileSystem.copyAsync({ from: uri, to: dest });
            persistedUri = dest;
          }
        } catch { /* fall back to recorder uri */ }
        setAudioUri(persistedUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Recording failed", "Could not save the voice memo. Please try again.");
      }
      return;
    }

    // Start recording
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) return;
      await audioRecorder.record();
      setListening(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { /* no microphone */ }
  };

  const handleVoice = () => {
    if (Platform.OS === "web") handleVoiceWeb();
    else handleVoiceNative();
  };

  const voiceAvailable = Platform.OS !== "web" || !!getWebRecognition();

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!canSave || saving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const createdAt = new Date(entryDate);
      createdAt.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds(), 0);
      await addEntry({
        title: title.trim(),
        note: note.trim(),
        tag: selectedTag,
        photoUri: photoUri ?? undefined,
        audioUri: audioUri ?? undefined,
        latitude: geo?.latitude,
        longitude: geo?.longitude,
        place: geo?.place ?? (manualPlace.trim() || undefined),
        mood: mood ?? undefined,
        createdAt: createdAt.toISOString(),
      });
      router.back();
    } catch { setSaving(false); }
  };

  return (
    <LinearGradient colors={[tagColor + "14", colors.background, colors.background]} locations={[0, 0.35, 1]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: topInset + 10, paddingBottom: bottomInset + 16 }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name="x" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.screenLabel, { color: colors.mutedForeground }]}>{t.common.newEntry}</Text>
          <Pressable style={[styles.saveBtn, { backgroundColor: canSave ? tagColor : colors.muted }]} onPress={handleSave} disabled={!canSave || saving}>
            {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={[styles.saveBtnText, { color: canSave ? "#000" : colors.mutedForeground }]}>{t.common.save}</Text>}
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Templates */}
          <FadeInView delay={50} from="bottom" distance={8} spring>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templatesRow}>
            {TEMPLATES.map((tpl) => (
              <Pressable key={tpl.id} onPress={() => handleTemplate(tpl)} style={[styles.tplChip, { backgroundColor: colors.muted }]}>
                <Text style={[styles.tplText, { color: colors.mutedForeground }]}>{tpl.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          </FadeInView>

          {/* Date picker */}
          <FadeInView delay={100} from="bottom" distance={8} spring>
          <View style={[styles.datePicker, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Pressable onPress={() => shiftDate(-1)} style={styles.dateArrow} hitSlop={8}>
              <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() => {
                if (!isToday) {
                  const t = new Date(); t.setHours(12, 0, 0, 0);
                  setEntryDate(t);
                  Haptics.selectionAsync();
                }
              }}
              style={styles.dateCenter}
            >
              <Feather name="calendar" size={13} color={!isToday ? tagColor : colors.mutedForeground} />
              <Text style={[styles.dateText, { color: !isToday ? tagColor : colors.foreground }]}>
                {formatEntryDate(entryDate)}
              </Text>
              {!isToday && (
                <View style={[styles.dateTodayBadge, { backgroundColor: tagColor + "20" }]}>
                  <Text style={[styles.dateTodayText, { color: tagColor }]}>tap for today</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => shiftDate(1)} style={[styles.dateArrow, { opacity: isToday ? 0.3 : 1 }]} hitSlop={8} disabled={isToday}>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
          </FadeInView>

          {/* Tags */}
          <FadeInView delay={150} from="bottom" distance={8} spring>
          <View style={styles.tagSection}>
            {TAGS.map((t) => {
              const isSelected = selectedTag === t.label;
              return (
                <AnimatedTagChip key={t.label} isSelected={isSelected} color={t.color} icon={t.icon} label={t.label} mutedBg={colors.muted} mutedFg={colors.mutedForeground}
                  onPress={() => { setSelectedTag(t.label); Haptics.selectionAsync(); }} />
              );
            })}
          </View>
          </FadeInView>

          {/* Title */}
          <FadeInView delay={200} from="bottom" distance={8} spring>
          <TextInput
            style={[styles.titleInput, { color: colors.foreground }]}
            placeholder={t.add.whatHappened}
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            returnKeyType="next"
            onSubmitEditing={() => noteRef.current?.focus()}
            autoFocus
            multiline
          />
          </FadeInView>

          <View style={[styles.noteDivider, { backgroundColor: colors.border }]} />

          {/* Note + Voice */}
          <View style={styles.noteRow}>
            <TextInput
              ref={noteRef}
              style={[styles.noteInput, { color: colors.foreground, flex: 1 }]}
              placeholder={t.add.addDetails}
              placeholderTextColor={colors.mutedForeground + "99"}
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
              maxLength={NOTE_MAX_LENGTH}
            />
            {voiceAvailable && (
              <Pressable onPress={handleVoice} style={[styles.voiceBtn, { backgroundColor: listening ? tagColor + "30" : colors.muted }]}>
                <Feather name="mic" size={16} color={listening ? tagColor : colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          {/* Voice status */}
          {listening && (
            <View style={[styles.voiceStatus, { backgroundColor: tagColor + "18", borderColor: tagColor + "35" }]}>
              <PulseView duration={800} minScale={0.8} maxScale={1.2} minOpacity={0.5}>
                <View style={[styles.voicePulseDot, { backgroundColor: tagColor }]} />
              </PulseView>
              <Text style={[styles.voiceStatusText, { color: tagColor }]}>
                {Platform.OS === "web" ? "Listening... speak now" : "Recording... tap mic to stop"}
              </Text>
            </View>
          )}
          {/* Photo */}
          <FadeInView delay={300} from="bottom" distance={10} spring>
          {photoUri ? (
            <View style={{ gap: 10 }}>
              <View>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
                <Pressable style={styles.removePhoto} onPress={() => setPhotoUri(null)}>
                  <Feather name="x" size={14} color="#fff" />
                </Pressable>
              </View>
              <Pressable
                style={[styles.ocrBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={handleOcrPhoto}
                disabled={ocrBusy}
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
          ) : (
            <View style={styles.photoRow}>
              <Pressable style={[styles.photoBtn, { backgroundColor: colors.muted }]} onPress={handlePickPhoto}>
                <Feather name="image" size={15} color={colors.mutedForeground} />
                <Text style={[styles.photoBtnText, { color: colors.mutedForeground }]}>{t.add.gallery}</Text>
              </Pressable>
              <Pressable style={[styles.photoBtn, { backgroundColor: colors.muted }]} onPress={handleCameraPhoto}>
                <Feather name="camera" size={15} color={colors.mutedForeground} />
                <Text style={[styles.photoBtnText, { color: colors.mutedForeground }]}>{t.add.camera}</Text>
              </Pressable>
            </View>
          )}
          </FadeInView>

          {/* Location tagging — always available, GPS or manual text */}
          {geo ? (
            <View style={[styles.geoChip, { borderColor: tagColor + "40", backgroundColor: tagColor + "12" }]}>
              <Feather name="map-pin" size={13} color={tagColor} />
              <Text numberOfLines={1} style={[styles.geoChipText, { color: colors.foreground }]}>
                {geo.place ?? `${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)}`}
              </Text>
              <Pressable onPress={() => setGeo(null)} hitSlop={8}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ) : manualPlace.trim() ? (
            <View style={[styles.geoChip, { borderColor: tagColor + "40", backgroundColor: tagColor + "12" }]}>
              <Feather name="map-pin" size={13} color={tagColor} />
              <Text numberOfLines={1} style={[styles.geoChipText, { color: colors.foreground }]}>{manualPlace}</Text>
              <Pressable onPress={() => setManualPlace("")} hitSlop={8}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ) : showPlaceInput ? (
            <View style={[styles.placeRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="map-pin" size={14} color={colors.mutedForeground} />
              <TextInput
                style={[styles.placeInput, { color: colors.foreground }]}
                placeholder="Type a place…"
                placeholderTextColor={colors.mutedForeground + "88"}
                value={manualPlace}
                onChangeText={setManualPlace}
                returnKeyType="done"
                onSubmitEditing={() => { if (!manualPlace.trim()) setShowPlaceInput(false); }}
                autoFocus
              />
              <Pressable
                onPress={() => { setShowPlaceInput(false); captureGeo(); }}
                hitSlop={8}
                disabled={capturingGeo}
                style={[styles.gpsBtn, { backgroundColor: tagColor + "20" }]}
              >
                {capturingGeo
                  ? <ActivityIndicator size="small" color={tagColor} />
                  : <Feather name="navigation" size={13} color={tagColor} />
                }
              </Pressable>
              <Pressable onPress={() => { setShowPlaceInput(false); setManualPlace(""); }} hitSlop={8}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowPlaceInput(true)}
              style={[styles.photoBtn, { backgroundColor: colors.muted, alignSelf: "flex-start" }]}
            >
              <Feather name="map-pin" size={15} color={colors.mutedForeground} />
              <Text style={[styles.photoBtnText, { color: colors.mutedForeground }]}>Add place</Text>
            </Pressable>
          )}

          {/* #5 Mood picker — five-emoji row */}
          <View style={styles.moodRow}>
            {ENTRY_MOOD_EMOJIS.map((m) => (
              <MoodButton key={m} emoji={m} active={mood === m} tagColor={tagColor} mutedBg={colors.muted} onPress={() => { setMood(mood === m ? null : m); Haptics.selectionAsync(); }} />
            ))}
          </View>

          {/* #9 Voice memo attached indicator */}
          {audioUri && (
            <View style={[styles.geoChip, { borderColor: tagColor + "40", backgroundColor: tagColor + "12" }]}>
              <Feather name="mic" size={13} color={tagColor} />
              <Text style={[styles.geoChipText, { color: colors.foreground }]}>Voice memo attached</Text>
              <Pressable onPress={() => setAudioUri(null)} hitSlop={8}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <View style={[styles.tagColorIndicator, { backgroundColor: tagColor }]} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Saving as <Text style={{ color: tagColor, fontFamily: "Inter_600SemiBold" }}>{selectedTag}</Text>
          </Text>
          {note.length > 0 && <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{note.length}/{NOTE_MAX_LENGTH}</Text>}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 16 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  screenLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2.5 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 100, minWidth: 64, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 24, gap: 16 },
  templatesRow: { gap: 8, paddingBottom: 4 },
  tplChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, marginRight: 0 },
  tplText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  tagSection: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100 },
  tagChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  titleInput: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.6, lineHeight: 34, minHeight: 80, padding: 0 },
  noteDivider: { height: 1, width: 32 },
  noteRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  noteInput: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 24, minHeight: 100, padding: 0 },
  voiceBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginTop: 2 },
  voiceStatus: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  voicePulseDot: { width: 7, height: 7, borderRadius: 4 },
  voiceStatusText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  photoPreview: { width: "100%", height: 180, borderRadius: 14 },
  removePhoto: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.6)", width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  ocrBtn: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth },
  geoChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth, alignSelf: "flex-start", maxWidth: "100%" },
  geoChipText: { fontSize: 13, fontFamily: "Inter_500Medium", flexShrink: 1 },
  datePicker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 10, paddingHorizontal: 6 },
  dateArrow: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  dateCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, flexWrap: "wrap" },
  dateText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dateTodayBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  dateTodayText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  photoRow: { flexDirection: "row", gap: 10 },
  photoBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  photoBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  footer: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, paddingTop: 12 },
  tagColorIndicator: { width: 6, height: 6, borderRadius: 3 },
  footerText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  charCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  moodRow: { flexDirection: "row", gap: 8, alignSelf: "flex-start" },
  moodChip: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  moodEmoji: { fontSize: 22 },
  placeRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  placeInput: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", padding: 0 },
  gpsBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
