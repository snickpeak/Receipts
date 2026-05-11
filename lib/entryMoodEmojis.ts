/** Same five mood options as entry composer & detail (comments / reactions). */
export const ENTRY_MOOD_EMOJIS = ["😄", "🙂", "😐", "😕", "😢"] as const;
export type EntryMoodEmoji = (typeof ENTRY_MOOD_EMOJIS)[number];

export function isEntryMoodEmoji(s: string): s is EntryMoodEmoji {
  return (ENTRY_MOOD_EMOJIS as readonly string[]).includes(s);
}
