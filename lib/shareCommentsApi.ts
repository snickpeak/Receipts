/**
 * Public comment API (no auth) — expected routes on the same host as `getRestApiBase()`:
 * - GET  /share/:token/comments  → { comments: ShareCommentShape[] }
 * - POST /share/:token/comments  body { emoji, text, authorDisplay? } → { comment: ShareCommentShape }
 *
 * Implement these on your Receipts API and host a public page at /p/:token that uses the same endpoints.
 */
import { getRestApiBase } from "@/lib/env";
import { ENTRY_MOOD_EMOJIS, isEntryMoodEmoji } from "@/lib/entryMoodEmojis";
import type { ShareComment } from "@/lib/shareTypes";

const MAX_COMMENT_CHARS = 400;

function sanitizeComment(raw: unknown): ShareComment | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const createdAt = typeof o.createdAt === "string" ? o.createdAt : "";
  const emoji = typeof o.emoji === "string" ? o.emoji : "";
  const text = typeof o.text === "string" ? o.text.slice(0, MAX_COMMENT_CHARS) : "";
  const authorDisplay = typeof o.authorDisplay === "string" ? o.authorDisplay.slice(0, 80) : undefined;
  if (!id || !createdAt || !isEntryMoodEmoji(emoji) || !text.trim()) return null;
  return { id, createdAt, emoji, text: text.trim(), ...(authorDisplay?.trim() ? { authorDisplay: authorDisplay.trim() } : {}) };
}

export function normalizeNewCommentInput(body: { emoji: string; text: string; authorDisplay?: string }): Omit<ShareComment, "id" | "createdAt"> | null {
  const emoji = body.emoji.trim();
  if (!isEntryMoodEmoji(emoji)) return null;
  const text = body.text.trim().slice(0, MAX_COMMENT_CHARS);
  if (!text.length) return null;
  const authorDisplay = body.authorDisplay?.trim().slice(0, 80);
  return {
    emoji,
    text,
    ...(authorDisplay ? { authorDisplay } : {}),
  };
}

/** Merge server list with local entries, deduping by id. */
export function mergeShareComments(existing: ShareComment[] | undefined, remote: ShareComment[]): ShareComment[] {
  const map = new Map<string, ShareComment>();
  for (const c of existing ?? []) map.set(c.id, c);
  for (const c of remote) map.set(c.id, c);
  return [...map.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function fetchShareComments(shareToken: string): Promise<ShareComment[]> {
  const base = getRestApiBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/share/${encodeURIComponent(shareToken)}/comments`);
    if (!res.ok) return [];
    const json = (await res.json()) as { comments?: unknown };
    const rows = Array.isArray(json.comments) ? json.comments : [];
    return rows.map(sanitizeComment).filter((c): c is ShareComment => c !== null);
  } catch {
    return [];
  }
}

export async function postShareComment(shareToken: string, body: { emoji: string; text: string; authorDisplay?: string }): Promise<ShareComment | null> {
  const base = getRestApiBase();
  if (!base) return null;
  const normalized = normalizeNewCommentInput(body);
  if (!normalized) return null;
  try {
    const res = await fetch(`${base}/share/${encodeURIComponent(shareToken)}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emoji: normalized.emoji,
        text: normalized.text,
        ...(normalized.authorDisplay ? { authorDisplay: normalized.authorDisplay } : {}),
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { comment?: unknown };
    return sanitizeComment(json.comment);
  } catch {
    return null;
  }
}

export { MAX_COMMENT_CHARS };
