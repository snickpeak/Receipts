export interface CustomTag {
  id: string;
  label: string;
  color: string;
  icon: string;
}

export const DEFAULT_TAGS: CustomTag[] = [
  { id: "win", label: "Win", color: "#f59e0b", icon: "award" },
  { id: "money", label: "Money", color: "#22c55e", icon: "dollar-sign" },
  { id: "memory", label: "Memory", color: "#a855f7", icon: "heart" },
  { id: "promise", label: "Promise", color: "#3b82f6", icon: "check-circle" },
  { id: "proof", label: "Proof", color: "#ef4444", icon: "shield" },
];

export function mergeTags(custom: CustomTag[] | undefined): CustomTag[] {
  const c = custom ?? [];
  const customLabels = new Set(c.map((t) => t.label));
  return [...DEFAULT_TAGS.filter((d) => !customLabels.has(d.label)), ...c];
}

export function getTagColor(label: string, custom?: CustomTag[]): string {
  const all = mergeTags(custom);
  return all.find((t) => t.label === label)?.color ?? "#a855f7";
}

export function getTagIcon(label: string, custom?: CustomTag[]): string {
  const all = mergeTags(custom);
  return all.find((t) => t.label === label)?.icon ?? "tag";
}
