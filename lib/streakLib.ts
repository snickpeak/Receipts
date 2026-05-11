import AsyncStorage from "@react-native-async-storage/async-storage";

export const BEST_STREAK_KEY = "receipts_best_streak_v1";

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export interface StreakInfo {
  current: number;
  best: number;
  hasToday: boolean;
}

export function computeStreak(entryDates: string[], persistedBest: number): StreakInfo {
  const set = new Set<string>();
  for (const iso of entryDates) {
    const d = new Date(iso);
    if (!isNaN(d.getTime())) set.add(dayKey(d));
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hasToday = set.has(dayKey(today));

  let cursor = new Date(today);
  if (!hasToday) cursor.setDate(cursor.getDate() - 1);

  let current = 0;
  while (set.has(dayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const best = Math.max(persistedBest || 0, current);
  return { current, best, hasToday };
}

export async function loadBestStreak(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(BEST_STREAK_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch { return 0; }
}

export async function persistBestStreak(value: number): Promise<void> {
  try { await AsyncStorage.setItem(BEST_STREAK_KEY, String(value)); } catch {}
}

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];
