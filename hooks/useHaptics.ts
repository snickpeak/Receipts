import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useSettings } from "@/context/SettingsContext";

export function useHaptics() {
  const { settings } = useSettings();

  const impact = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (!settings.hapticsEnabled || Platform.OS === "web") return;
    void Haptics.impactAsync(style);
  };

  const selection = () => {
    if (!settings.hapticsEnabled || Platform.OS === "web") return;
    void Haptics.selectionAsync();
  };

  const notification = (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
    if (!settings.hapticsEnabled || Platform.OS === "web") return;
    void Haptics.notificationAsync(type);
  };

  return { impact, selection, notification };
}
