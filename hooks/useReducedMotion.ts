import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Respects iOS/Android “Reduce motion” for lighter animations + haptics emphasis. */
export function useReducedMotion(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    const load = async () => {
      try {
        const v = await AccessibilityInfo.isReduceMotionEnabled();
        setEnabled(!!v);
        sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setEnabled);
      } catch {
        setEnabled(false);
      }
    };
    void load();
    return () => sub?.remove();
  }, []);

  return enabled;
}
