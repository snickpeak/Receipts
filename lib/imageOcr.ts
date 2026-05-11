export type ImageOcrResult = { supported: boolean; text: string };

export const NOTE_MAX_LENGTH = 2000;

/** Append OCR text to a note, capped at {@link NOTE_MAX_LENGTH}. */
export function mergeNoteWithOcr(current: string, ocr: string): { text: string; trimmed: boolean } {
  const o = ocr.trim();
  if (!o) return { text: current, trimmed: false };
  const merged = current.trim() ? `${current.trim()}\n\n${o}` : o;
  if (merged.length <= NOTE_MAX_LENGTH) return { text: merged, trimmed: false };
  return { text: merged.slice(0, NOTE_MAX_LENGTH), trimmed: true };
}

type ExtractorModule = typeof import("expo-text-extractor");

let extractorModule: ExtractorModule | null | undefined;

async function loadExtractor(): Promise<ExtractorModule | null> {
  if (extractorModule !== undefined) return extractorModule;
  try {
    extractorModule = await import("expo-text-extractor");
  } catch {
    extractorModule = null;
  }
  return extractorModule;
}

/**
 * On-device OCR via iOS Vision / Android ML Kit (expo-text-extractor).
 * Dynamic import avoids crashing clients where the native module is not linked (e.g. Expo Go).
 */
export async function runImageOcr(uri: string): Promise<ImageOcrResult> {
  const mod = await loadExtractor();
  if (!mod?.isSupported) return { supported: false, text: "" };
  const lines = await mod.extractTextFromImage(uri);
  const text = lines
    .map((l) => l.replace(/\s+$/g, ""))
    .filter((l) => l.length > 0)
    .join("\n")
    .trim();
  return { supported: true, text };
}
