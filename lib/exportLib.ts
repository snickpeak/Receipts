import type { Entry } from "@/context/EntriesContext";
import { buildPublicEntryLink } from "@/lib/shareLink";

export function wordCount(text: string): number {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function readingTimeMinutes(text: string): number {
  const words = wordCount(text);
  return Math.max(1, Math.round(words / 220));
}

export function entryWordCount(entry: Entry): number {
  return wordCount(entry.title) + wordCount(entry.note ?? "");
}

export function totalWordsAcross(entries: Entry[]): number {
  let n = 0;
  for (const e of entries) n += entryWordCount(e);
  return n;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("default", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export function entryToMarkdown(entry: Entry): string {
  const lines: string[] = [];
  lines.push(`# ${entry.title || "Untitled"}`);
  lines.push("");
  lines.push(`*${fmtDate(entry.createdAt)} · #${entry.tag}${entry.starred ? " · ⭐" : ""}${entry.pinned ? " · 📌" : ""}${entry.mood ? ` · ${entry.mood}` : ""}*`);
  lines.push("");
  if (entry.note) {
    lines.push(entry.note);
    lines.push("");
  }
  if (entry.receiptVendor || entry.receiptAmount || entry.receiptLocation || entry.receiptDate) {
    lines.push("## Receipt");
    if (entry.receiptVendor) lines.push(`- **Vendor:** ${entry.receiptVendor}`);
    if (entry.receiptAmount) lines.push(`- **Amount:** ${entry.receiptAmount}${entry.receiptCurrency ? ` ${entry.receiptCurrency}` : ""}`);
    if (entry.receiptLocation) lines.push(`- **Location:** ${entry.receiptLocation}`);
    if (entry.receiptDate) lines.push(`- **Date:** ${entry.receiptDate}`);
    if (entry.receiptExtra) lines.push(`- **Notes:** ${entry.receiptExtra}`);
    lines.push("");
  }
  if (entry.place || (typeof entry.latitude === "number" && typeof entry.longitude === "number")) {
    lines.push(`📍 ${entry.place ?? `${entry.latitude}, ${entry.longitude}`}`);
    lines.push("");
  }
  if (entry.aiSummary) {
    lines.push("## Archived summary");
    lines.push("");
    lines.push(entry.aiSummary);
    lines.push("");
  }
  const publicLink = buildPublicEntryLink(entry.shareToken);
  if (entry.shareVisibility === "public" && publicLink) {
    lines.push("## Public link");
    lines.push(publicLink);
    lines.push("");
  }
  const sc = entry.shareComments ?? [];
  if (entry.shareVisibility === "public" && entry.commentsEnabled && sc.length > 0) {
    lines.push("## Comments");
    for (const c of sc) {
      lines.push(`- ${c.emoji} ${c.text}${c.authorDisplay ? ` — _${c.authorDisplay}_` : ""}`);
    }
    lines.push("");
  }
  lines.push("---");
  lines.push("*Exported from Receipts*");
  return lines.join("\n");
}

export function entriesToMarkdown(entries: Entry[]): string {
  const sorted = [...entries].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const blocks = sorted.map((e) => entryToMarkdown(e));
  return blocks.join("\n\n");
}
