import type { EntryMoodEmoji } from "@/lib/entryMoodEmojis";

export interface ShareComment {
  id: string;
  createdAt: string;
  emoji: EntryMoodEmoji;
  text: string;
  /** Shown for guests; optional */
  authorDisplay?: string;
}
