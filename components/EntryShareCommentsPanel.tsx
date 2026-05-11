import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Entry } from "@/context/EntriesContext";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/hooks/useTranslation";
import { ENTRY_MOOD_EMOJIS } from "@/lib/entryMoodEmojis";
import { getRestApiBase } from "@/lib/env";
import {
  fetchShareComments,
  MAX_COMMENT_CHARS,
  mergeShareComments,
  postShareComment,
} from "@/lib/shareCommentsApi";
import { buildPublicEntryLink, generateShareToken } from "@/lib/shareLink";
import type { ShareComment } from "@/lib/shareTypes";

type Patch = Partial<
  Pick<Entry, "shareVisibility" | "shareToken" | "commentsEnabled" | "shareComments">
>;

export function EntryShareCommentsPanel({
  entry,
  onPatch,
  online,
  tagColor,
}: {
  entry: Entry;
  onPatch: (u: Patch) => void | Promise<void>;
  online: boolean;
  tagColor: string;
}) {
  const colors = useColors();
  const t = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [draftEmoji, setDraftEmoji] = useState<(typeof ENTRY_MOOD_EMOJIS)[number]>("🙂");
  const [draftText, setDraftText] = useState("");
  const [draftName, setDraftName] = useState("");

  const hasApi = !!getRestApiBase();
  const isPublic = entry.shareVisibility === "public";
  const url = buildPublicEntryLink(entry.shareToken);
  const showCommentsUi = isPublic && (entry.commentsEnabled ?? false);
  const commentsNeedApi = showCommentsUi && !hasApi;

  const pullComments = async () => {
    if (!entry.shareToken || !showCommentsUi) return;
    setRefreshing(true);
    try {
      const remote = await fetchShareComments(entry.shareToken);
      const merged = mergeShareComments(entry.shareComments, remote);
      await onPatch({ shareComments: merged });
    } finally {
      setRefreshing(false);
    }
  };

  const removeCommentLocal = async (cid: string) => {
    const next = (entry.shareComments ?? []).filter((c) => c.id !== cid);
    await onPatch({ shareComments: next });
    Haptics.selectionAsync();
  };

  const copyUrl = async () => {
    if (!url) {
      Alert.alert(t.entryShare.copyLink, t.entryShare.noLinkBase);
      return;
    }
    await Clipboard.setStringAsync(url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t.common.ok, t.entryShare.copied);
  };

  const onTogglePublic = (v: boolean) => {
    Haptics.selectionAsync();
    if (v) {
      const token = entry.shareToken ?? generateShareToken();
      void onPatch({ shareVisibility: "public", shareToken: token });
    } else {
      void onPatch({ shareVisibility: "private", commentsEnabled: false });
    }
  };

  const onToggleComments = (v: boolean) => {
    Haptics.selectionAsync();
    void onPatch({ commentsEnabled: v });
  };

  const regenerate = () => {
    Alert.alert(t.entryShare.regenerateConfirmTitle, t.entryShare.regenerateConfirmBody, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.entryShare.regenerate,
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          void onPatch({ shareToken: generateShareToken() });
        },
      },
    ]);
  };

  const submitComment = async () => {
    if (!entry.shareToken || !showCommentsUi || posting) return;
    const text = draftText.trim();
    if (!text) return;
    setPosting(true);
    Haptics.selectionAsync();
    try {
      const saved = await postShareComment(entry.shareToken, {
        emoji: draftEmoji,
        text,
        authorDisplay: draftName.trim() || undefined,
      });
      if (saved) {
        await onPatch({ shareComments: mergeShareComments(entry.shareComments, [saved]) });
        setDraftText("");
        setDraftName("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert(t.common.error, t.entryShare.postFailed);
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t.entryShare.section}</Text>

      {commentsNeedApi ? (
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>{t.entryShare.commentsNeedApi}</Text>
      ) : null}

      <View style={styles.rowBetween}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t.entryShare.publicLink}</Text>
          <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
            {isPublic ? t.entryShare.publicSub : t.entryShare.privateSub}
          </Text>
        </View>
        <Switch
          accessibilityLabel={t.entryShare.publicLink}
          value={isPublic}
          onValueChange={onTogglePublic}
          trackColor={{ false: colors.border, true: tagColor + "77" }}
          thumbColor={isPublic ? tagColor : colors.mutedForeground}
        />
      </View>

      {isPublic ? (
        <View style={{ gap: 10 }}>
          {url ? (
            <Pressable onLongPress={() => void copyUrl()}>
              <Text style={[styles.urlText, { color: tagColor }]} selectable>
                {url}
              </Text>
            </Pressable>
          ) : (
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>{t.entryShare.noLinkBase}</Text>
          )}
          <View style={styles.rowActions}>
            <Pressable
              style={[styles.smallBtn, { backgroundColor: tagColor + "22", borderColor: tagColor + "44" }]}
              onPress={() => void copyUrl()}
              disabled={!url}
            >
              <Feather name="copy" size={14} color={tagColor} />
              <Text style={[styles.smallBtnText, { color: tagColor }]}>{t.entryShare.copyLink}</Text>
            </Pressable>
            <Pressable
              style={[styles.smallBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={regenerate}
            >
              <Feather name="refresh-ccw" size={14} color={colors.foreground} />
              <Text style={[styles.smallBtnText, { color: colors.foreground }]}>{t.entryShare.regenerate}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      <View style={styles.rowBetween}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>{t.entryShare.allowComments}</Text>
          <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
            {isPublic ? t.entryShare.commentsSub : t.entryShare.privateSub}
          </Text>
        </View>
        <Switch
          accessibilityLabel={t.entryShare.allowComments}
          value={!!entry.commentsEnabled}
          disabled={!isPublic}
          onValueChange={onToggleComments}
          trackColor={{ false: colors.border, true: tagColor + "77" }}
          thumbColor={(entry.commentsEnabled ?? false) && isPublic ? tagColor : colors.mutedForeground}
        />
      </View>

      {showCommentsUi ? (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 6 }]}>{t.entryShare.commentsSection}</Text>

          <View style={styles.rowActions}>
            <Pressable
              style={[styles.smallBtn, { backgroundColor: colors.background, borderColor: colors.border, opacity: online ? 1 : 0.5 }]}
              onPress={() => void pullComments()}
              disabled={refreshing || !online}
            >
              {refreshing ? <ActivityIndicator size="small" color={colors.mutedForeground} /> : <Feather name="globe" size={14} color={colors.foreground} />}
              <Text style={[styles.smallBtnText, { color: colors.foreground }]}>{t.entryShare.pullRemote}</Text>
            </Pressable>
          </View>

          <View style={styles.emojiRow}>
            {ENTRY_MOOD_EMOJIS.map((emo) => {
              const active = draftEmoji === emo;
              return (
                <Pressable
                  key={emo}
                  onPress={() => {
                    setDraftEmoji(emo);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.emojiChip,
                    { borderColor: active ? tagColor : "transparent", backgroundColor: active ? tagColor + "18" : colors.background },
                  ]}
                >
                  <Text style={styles.emojiChar}>{emo}</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder={t.entryShare.placeholder}
            placeholderTextColor={colors.mutedForeground}
            value={draftText}
            maxLength={MAX_COMMENT_CHARS}
            onChangeText={setDraftText}
            multiline
          />

          <TextInput
            style={[styles.inputSingle, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder={t.entryShare.nameOptional}
            placeholderTextColor={colors.mutedForeground}
            value={draftName}
            maxLength={80}
            onChangeText={setDraftName}
          />

          <Pressable
            style={[styles.submit, { backgroundColor: tagColor, opacity: posting || !draftText.trim() ? 0.55 : 1 }]}
            onPress={() => void submitComment()}
            disabled={posting || !draftText.trim() || !online}
          >
            {posting ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.submitText}>{t.entryShare.post}</Text>}
          </Pressable>

          {(entry.shareComments ?? []).length === 0 ? (
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>{t.entryShare.emptyComments}</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {[...(entry.shareComments ?? [])]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((c: ShareComment) => (
                  <View key={c.id} style={[styles.commentRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Text style={styles.commentEmoji}>{c.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.commentText, { color: colors.foreground }]}>{c.text}</Text>
                      <Text style={[styles.commentMeta, { color: colors.mutedForeground }]}>
                        {c.authorDisplay ? `${c.authorDisplay} · ` : ""}
                        {new Date(c.createdAt).toLocaleString()}
                      </Text>
                    </View>
                    <Pressable hitSlop={8} onPress={() => removeCommentLocal(c.id)}>
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ))}
            </View>
          )}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 17 },
  urlText: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 20 },
  rowActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
  },
  smallBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  separator: { height: StyleSheet.hairlineWidth, width: "100%", marginVertical: 2 },
  emojiRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", alignSelf: "flex-start" },
  emojiChip: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  emojiChar: { fontSize: 20 },
  input: { minHeight: 72, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, textAlignVertical: "top", fontFamily: "Inter_400Regular", fontSize: 15 },
  inputSingle: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14 },
  submit: {
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#000" },
  commentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  commentEmoji: { fontSize: 22, marginTop: 2 },
  commentText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  commentMeta: { fontSize: 11, marginTop: 4, fontFamily: "Inter_400Regular" },
});
