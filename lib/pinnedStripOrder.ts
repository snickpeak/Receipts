import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "receipts_pinned_strip_order_v1";

export async function loadPinnedStripOrder(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function savePinnedStripOrder(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
}

/** Pin order from storage first; append any pinned ids not in the list. */
export function sortPinnedEntries<T extends { id: string }>(entries: T[], order: string[]): T[] {
  const map = new Map(entries.map((e) => [e.id, e]));
  const used = new Set<string>();
  const out: T[] = [];
  for (const id of order) {
    const e = map.get(id);
    if (e) {
      out.push(e);
      used.add(id);
    }
  }
  for (const e of entries) {
    if (!used.has(e.id)) out.push(e);
  }
  return out;
}
