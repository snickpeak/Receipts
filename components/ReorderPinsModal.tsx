import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";

import { useColors } from "@/hooks/useColors";
import { useLocaleFont } from "@/hooks/useLocaleFont";
import type { Entry } from "@/context/EntriesContext";

type Props = {
  visible: boolean;
  pinned: Entry[];
  onClose: () => void;
  onReorder: (orderedIds: string[]) => void;
};

export function ReorderPinsModal({ visible, pinned, onClose, onReorder }: Props) {
  const colors = useColors();
  const font = useLocaleFont();
  const { height } = useWindowDimensions();
  const [data, setData] = useState<Entry[]>(pinned);

  useEffect(() => {
    if (visible) setData(pinned);
  }, [pinned, visible]);

  const showDrag = Platform.OS !== "web";

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Entry>) => {
    return (
      <ScaleDecorator activeScale={1.03}>
        <Pressable
          onLongPress={showDrag ? drag : undefined}
          disabled={isActive}
          delayLongPress={180}
          style={[
            styles.row,
            {
              backgroundColor: colors.card,
              borderColor: isActive ? "#a855f7" : colors.border,
              opacity: isActive ? 0.92 : 1,
            },
          ]}
        >
          <Feather name="menu" size={18} color={colors.mutedForeground} />
          <Text style={[styles.title, { color: colors.foreground, fontFamily: font.semibold }]} numberOfLines={2}>
            {item.locked ? "🔒 Locked" : item.title}
          </Text>
          <Feather name="more-vertical" size={16} color={colors.mutedForeground} />
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border, maxHeight: height * 0.62 }]}>
        <View style={[styles.grab, { backgroundColor: colors.border }]} />
        <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: font.bold }]}>Reorder pinned</Text>
        <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
          {showDrag ? "Long-press and drag to reorder · order is saved automatically." : "Open the app on a device to drag and reorder pinned entries."}
        </Text>
        {showDrag ? (
          <DraggableFlatList
            data={data}
            keyExtractor={(it) => it.id}
            onDragEnd={({ data: next }) => {
              setData(next);
              onReorder(next.map((e) => e.id));
              if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
            activationDistance={12}
            renderItem={renderItem}
            scrollEnabled={data.length > 4}
            contentContainerStyle={{ paddingBottom: 16, gap: 8 }}
          />
        ) : (
          <View style={{ gap: 8 }}>
            {pinned.map((p) => (
              <View key={p.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="bookmark" size={18} color="#a855f7" />
                <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
                  {p.title}
                </Text>
              </View>
            ))}
          </View>
        )}
        <Pressable style={[styles.doneBtn, { backgroundColor: "#a855f7" }]} onPress={onClose}>
          <Text style={[styles.doneText, { fontFamily: font.semibold }]}>Done</Text>
        </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  grab: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginTop: 10, marginBottom: 14 },
  sheetTitle: { fontSize: 18, letterSpacing: -0.3, marginBottom: 4 },
  sheetSub: { fontSize: 13, marginBottom: 14, lineHeight: 18 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { flex: 1, fontSize: 15 },
  doneBtn: { marginTop: 18, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  doneText: { color: "#0a0a0a", fontSize: 15 },
});
