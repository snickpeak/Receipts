import { Platform } from "react-native";

export function getClerkPublishableKey(): string | undefined {
  const k = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  return k && k.length > 0 ? k : undefined;
}

function nativeHost(): string {
  return (process.env.EXPO_PUBLIC_DOMAIN ?? "").trim();
}

/**
 * Base including `/api`: `/api` on web, `https://<EXPO_PUBLIC_DOMAIN>/api` on native.
 * Null on native when `EXPO_PUBLIC_DOMAIN` is missing (invalid URLs must be avoided).
 */
export function getRestApiBase(): string | null {
  if (Platform.OS === "web") return "/api";
  const host = nativeHost();
  if (!host) return null;
  return `https://${host}/api`;
}

/**
 * Origin without `/api` for paths like `/api/receipts/...`. Web: `""`. Native: `https://host` or null.
 */
export function getReceiptsApiOrigin(): string | null {
  if (Platform.OS === "web") return "";
  const host = nativeHost();
  if (!host) return null;
  return `https://${host}`;
}

/** Path under `/api/...` → full URL, or null on native when domain is missing. */
export function getReceiptsApiUrl(pathFromApi: string): string | null {
  const o = getReceiptsApiOrigin();
  if (o === null) return null;
  return `${o}${pathFromApi.startsWith("/") ? pathFromApi : `/${pathFromApi}`}`;
}

/**
 * Base origin for public entry pages opened from share links, e.g. `https://journal.example.com`.
 * Use `EXPO_PUBLIC_SHARE_WEB_ORIGIN` when it differs from the API host.
 * On web, defaults to `window.location.origin` so local dev can open `/p/:token`.
 */
export function getShareWebBase(): string | null {
  if (typeof window !== "undefined" && typeof window.location?.origin === "string" && window.location.origin.length > 0) {
    return window.location.origin.replace(/\/$/, "");
  }
  const explicit = (process.env.EXPO_PUBLIC_SHARE_WEB_ORIGIN ?? "").trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const host = (process.env.EXPO_PUBLIC_DOMAIN ?? "").trim();
  if (!host) return null;
  return `https://${host}`;
}

let warnedMissingDomain = false;

export function warnMissingNativeDomainOnce(): void {
  if (Platform.OS === "web") return;
  if (nativeHost()) return;
  if (warnedMissingDomain) return;
  warnedMissingDomain = true;
  console.warn(
    "[Receipts] EXPO_PUBLIC_DOMAIN is empty. Cloud sync and server-backed features on iOS/Android need a host (e.g. api.example.com) in artifacts/mobile/.env.",
  );
}
