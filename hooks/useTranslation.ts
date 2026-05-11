import { getTranslations } from "@/i18n/translations";
import { useSettings } from "@/context/SettingsContext";

export function useTranslation() {
  const { settings } = useSettings();
  return getTranslations(settings.language);
}
