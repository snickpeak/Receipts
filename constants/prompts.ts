import type { Tag } from "@/context/EntriesContext";

export interface DailyPrompt {
  text: string;
  tag: Tag;
}

export const DAILY_PROMPTS: DailyPrompt[] = [
  { text: "What was your biggest win today?", tag: "Win" },
  { text: "What did you accomplish that you almost forgot to celebrate?", tag: "Win" },
  { text: "What skill improved this week?", tag: "Win" },
  { text: "When did you push past a limit lately?", tag: "Win" },
  { text: "What challenge did you overcome recently?", tag: "Win" },
  { text: "What received praise or recognition this week?", tag: "Win" },
  { text: "What's a goal you've been quietly crushing?", tag: "Win" },
  { text: "What moment this week deserves a trophy?", tag: "Win" },
  { text: "What money move did you make today?", tag: "Money" },
  { text: "Any financial wins or decisions worth documenting?", tag: "Money" },
  { text: "Did you earn, save, or invest something noteworthy?", tag: "Money" },
  { text: "What's a money lesson you learned recently?", tag: "Money" },
  { text: "Any deals, discounts, or financial upgrades worth remembering?", tag: "Money" },
  { text: "What made you genuinely smile today?", tag: "Memory" },
  { text: "What conversation will you remember a year from now?", tag: "Memory" },
  { text: "Describe a moment of peace or joy from this week.", tag: "Memory" },
  { text: "Who showed up for you recently?", tag: "Memory" },
  { text: "What small thing meant a lot to you today?", tag: "Memory" },
  { text: "What place, meal, or experience do you want to remember?", tag: "Memory" },
  { text: "What are you grateful for right now?", tag: "Memory" },
  { text: "What would be a shame to forget about this week?", tag: "Memory" },
  { text: "What did you commit to today that matters?", tag: "Promise" },
  { text: "Who did you make a promise to — and what was it?", tag: "Promise" },
  { text: "What intention are you setting for this week?", tag: "Promise" },
  { text: "What's a promise you made to yourself recently?", tag: "Promise" },
  { text: "What are you holding yourself accountable to?", tag: "Promise" },
  { text: "What agreement or plan did you lock in today?", tag: "Promise" },
  { text: "What evidence do you have of your growth?", tag: "Proof" },
  { text: "What screenshot, receipt, or document should you save today?", tag: "Proof" },
  { text: "What confirmation or approval came through recently?", tag: "Proof" },
  { text: "What did someone say about you worth keeping?", tag: "Proof" },
  { text: "Any work, creation, or result worth documenting as proof?", tag: "Proof" },
  { text: "What number, stat, or metric shows your progress?", tag: "Proof" },
  { text: "What before-and-after moment is worth capturing?", tag: "Proof" },
  { text: "What would be hard to believe without evidence?", tag: "Proof" },
];

export function getDailyPrompt(): DailyPrompt {
  const dateStr = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return DAILY_PROMPTS[hash % DAILY_PROMPTS.length];
}
