import { getShareWebBase } from "@/lib/env";

/** Create a new opaque token for public share URLs. */
export function generateShareToken(): string {
  const bytes = new Uint8Array(14);
  try {
    globalThis.crypto?.getRandomValues?.(bytes);
  } catch {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Public page URL for this entry. Backend should serve `GET /p/:token` (or proxy the same path).
 * Configure `EXPO_PUBLIC_SHARE_WEB_ORIGIN` or `EXPO_PUBLIC_DOMAIN` (see env).
 */
export function buildPublicEntryLink(shareToken: string | undefined): string | null {
  if (!shareToken) return null;
  const base = getShareWebBase();
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/p/${encodeURIComponent(shareToken)}`;
}
