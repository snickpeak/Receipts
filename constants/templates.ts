import type { Tag } from "@/context/EntriesContext";

export interface EntryTemplate {
  id: string;
  label: string;
  tag: Tag;
  titlePrefix: string;
  notePlaceholder: string;
}

export const TEMPLATES: EntryTemplate[] = [
  {
    id: "daily-win",
    label: "Daily Win",
    tag: "Win",
    titlePrefix: "Today I won: ",
    notePlaceholder: "What happened? What did it take to get here?",
  },
  {
    id: "money-log",
    label: "Money Log",
    tag: "Money",
    titlePrefix: "",
    notePlaceholder: "Income / expense / savings update...",
  },
  {
    id: "promise",
    label: "Promise Made",
    tag: "Promise",
    titlePrefix: "I promised to ",
    notePlaceholder: "Who did you promise? By when? The exact terms...",
  },
  {
    id: "core-memory",
    label: "Core Memory",
    tag: "Memory",
    titlePrefix: "I want to remember ",
    notePlaceholder: "What happened, who was there, how it felt...",
  },
  {
    id: "proof",
    label: "Proof of Work",
    tag: "Proof",
    titlePrefix: "Evidence: ",
    notePlaceholder: "Screenshot, receipt, or description of the proof...",
  },
  {
    id: "lesson",
    label: "Lesson Learned",
    tag: "Proof",
    titlePrefix: "Lesson: ",
    notePlaceholder: "What happened and what it taught you...",
  },
  {
    id: "grateful",
    label: "Gratitude",
    tag: "Memory",
    titlePrefix: "Grateful for ",
    notePlaceholder: "Why are you grateful? What does it mean to you?",
  },
];
