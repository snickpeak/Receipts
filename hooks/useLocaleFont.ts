import { useSettings } from "@/context/SettingsContext";

const ETHIOPIC_LANGS = new Set(["am"]);

export type LocaleFont = {
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
  isEthiopic: boolean;
};

export function useLocaleFont(): LocaleFont {
  const { settings } = useSettings();
  const isEthiopic = ETHIOPIC_LANGS.has(settings.language);
  return {
    regular:  isEthiopic ? "NotoSansEthiopic_400Regular" : "Inter_400Regular",
    medium:   isEthiopic ? "NotoSansEthiopic_500Medium"  : "Inter_500Medium",
    semibold: isEthiopic ? "NotoSansEthiopic_600SemiBold": "Inter_600SemiBold",
    bold:     isEthiopic ? "NotoSansEthiopic_700Bold"    : "Inter_700Bold",
    isEthiopic,
  };
}
