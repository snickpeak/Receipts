import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import NetInfo from "@react-native-community/netinfo";

import { encryptString, decryptString, isEncrypted } from "@/lib/cryptoLib";
import type { ShareComment } from "@/lib/shareTypes";
import { enqueue, readQueue, replaceProcessed, queueLength, type SyncOp } from "@/lib/syncQueue";

export type { ShareComment } from "@/lib/shareTypes";

export type Tag = string;

export interface Entry {
  id: string;
  title: string;
  note: string;
  tag: Tag;
  createdAt: string;
  updatedAt?: string;
  aiSummary: string | null;
  photoUri?: string;
  receiptPdfUri?: string;
  receiptVendor?: string;
  receiptLocation?: string;
  receiptAmount?: string;
  receiptCurrency?: string;
  receiptDate?: string;
  receiptExtra?: string;
  starred?: boolean;
  relatedIds?: string[];
  locked?: boolean;
  prevHash?: string;
  hash?: string;
  audioUri?: string;
  latitude?: number;
  longitude?: number;
  place?: string;
  // ── New batch ────────────────────────────────────────────────────────────
  mood?: string;        // #5 — single emoji
  pinned?: boolean;     // #6 — pinned to timeline strip
  trashedAt?: string;   // #7 — soft-delete timestamp; >30d → permanently purged
  // Public share + guest comments (URLs + API contracts in lib/shareLink.ts, lib/shareCommentsApi.ts)
  shareVisibility?: "private" | "public";
  shareToken?: string;
  commentsEnabled?: boolean;
  shareComments?: ShareComment[];
}

interface EntriesContextType {
  entries: Entry[];
  syncing: boolean;
  syncError: string | null;
  tamperDetected: boolean;
  online: boolean;
  pendingSyncCount: number;
  localOnlyMode: boolean;
  setEncryptionContext: (enabled: boolean, passphrase: string, salt: string) => void;
  setLocalOnlyMode: (enabled: boolean) => void;
  addEntry: (data: Omit<Entry, "id" | "createdAt" | "aiSummary"> & { createdAt?: string }) => Promise<string>;
  deleteEntry: (id: string) => Promise<void>;
  deleteAllEntries: () => Promise<void>;
  clearLocalEntries: () => Promise<void>;
  updateEntry: (
    id: string,
    updates: Partial<
      Pick<
        Entry,
        | "title"
        | "note"
        | "tag"
        | "photoUri"
        | "receiptPdfUri"
        | "receiptVendor"
        | "receiptLocation"
        | "receiptAmount"
        | "receiptCurrency"
        | "receiptDate"
        | "receiptExtra"
        | "mood"
        | "shareVisibility"
        | "shareToken"
        | "commentsEnabled"
        | "shareComments"
      >
    >,
  ) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  toggleLocked: (id: string) => Promise<void>;
  linkEntries: (id1: string, id2: string) => Promise<void>;
  unlinkEntries: (id1: string, id2: string) => Promise<void>;
  importEntries: (imported: Entry[]) => Promise<void>;
  entryCount: number;
  // ── New batch ────────────────────────────────────────────────────────────
  trashedEntries: Entry[];
  togglePin: (id: string) => Promise<{ ok: boolean; reason?: "limit" }>;
  restoreEntry: (id: string) => Promise<void>;
  permanentlyDelete: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  findEntryById: (id: string | undefined) => Entry | undefined;
  renameTagEverywhere: (oldLabel: string, newLabel: string) => Promise<void>;
  mergeTagInto: (sourceLabel: string, targetLabel: string) => Promise<void>;
}

export const PIN_LIMIT = 5;
export const TRASH_TTL_DAYS = 30;

// Lightweight FNV-1a hash (sync, no native deps). Produces 8-char hex string.
function fnv1aHex(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function canonicalEntryFor(entry: Entry, prevHash: string): string {
  // Cover all user-visible fields so tampering with photos/receipts/lock state is detectable.
  return JSON.stringify({
    id: entry.id,
    title: entry.title,
    note: entry.note,
    tag: entry.tag,
    createdAt: entry.createdAt,
    photoUri: entry.photoUri ?? "",
    receiptVendor: entry.receiptVendor ?? "",
    receiptAmount: entry.receiptAmount ?? "",
    receiptCurrency: entry.receiptCurrency ?? "",
    receiptDate: entry.receiptDate ?? "",
    receiptLocation: entry.receiptLocation ?? "",
    receiptExtra: entry.receiptExtra ?? "",
    aiSummary: entry.aiSummary ?? "",
    locked: entry.locked === true,
    prev: prevHash,
  });
}

// allowMissing=true is used for one-time legacy data migration (no entries have hashes yet).
function computeChain(entries: Entry[], allowMissing: boolean): { entries: Entry[]; tampered: boolean } {
  const ascending = [...entries].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  let prev = "";
  let tampered = false;
  const rebuilt: Entry[] = ascending.map((e) => {
    const expected = fnv1aHex(canonicalEntryFor(e, prev));
    // Tamper if hash mismatches OR (hash absent && we expected one) OR prevHash differs from chain.
    const hashMismatch = e.hash !== undefined && e.hash !== expected;
    const hashMissing = !allowMissing && e.hash === undefined;
    const prevMismatch = e.prevHash !== undefined && e.prevHash !== prev;
    if (hashMismatch || hashMissing || prevMismatch) tampered = true;
    const next: Entry = { ...e, prevHash: prev, hash: expected };
    prev = expected;
    return next;
  });
  rebuilt.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { entries: rebuilt, tampered };
}

import { getRestApiBase, warnMissingNativeDomainOnce } from "@/lib/env";

const STORAGE_KEY = "receipts_entries_v1";
const TAMPER_KEY = "receipts_tamper_flag_v1";

const EntriesContext = createContext<EntriesContextType | null>(null);

function dbRowToEntry(row: Record<string, unknown>): Entry {
  return {
    id: row.id as string,
    title: (row.title as string) ?? "",
    note: (row.note as string) ?? "",
    tag: (row.tag as Tag) ?? "Memory",
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt ? (row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt)) : undefined,
    aiSummary: (row.aiSummary as string | null) ?? null,
    photoUri: (row.photoUri as string | undefined) ?? undefined,
    receiptPdfUri: (row.receiptPdfUri as string | undefined) ?? undefined,
    receiptVendor: (row.receiptVendor as string | undefined) ?? undefined,
    receiptLocation: (row.receiptLocation as string | undefined) ?? undefined,
    receiptAmount: (row.receiptAmount as string | undefined) ?? undefined,
    receiptCurrency: (row.receiptCurrency as string | undefined) ?? undefined,
    receiptDate: (row.receiptDate as string | undefined) ?? undefined,
    receiptExtra: (row.receiptExtra as string | undefined) ?? undefined,
    starred: (row.starred as boolean) ?? false,
    relatedIds: (row.relatedIds as string[]) ?? [],
    locked: (row.locked as boolean) ?? false,
    prevHash: (row.prevHash as string | undefined) ?? undefined,
    hash: (row.hash as string | undefined) ?? undefined,
    audioUri: (row.audioUri as string | undefined) ?? undefined,
    latitude: typeof row.latitude === "number" ? (row.latitude as number) : undefined,
    longitude: typeof row.longitude === "number" ? (row.longitude as number) : undefined,
    place: (row.place as string | undefined) ?? undefined,
    mood: (row.mood as string | undefined) ?? undefined,
    pinned: (row.pinned as boolean) ?? false,
    trashedAt: (row.trashedAt as string | undefined) ?? undefined,
    shareVisibility: (row.shareVisibility as Entry["shareVisibility"]) === "public" ? "public" : "private",
    shareToken: (row.shareToken as string | undefined) ?? undefined,
    commentsEnabled: (row.commentsEnabled as boolean) ?? false,
    shareComments: Array.isArray(row.shareComments) ? (row.shareComments as ShareComment[]) : undefined,
  };
}

function entryTimestamp(entry: Entry) {
  return new Date(entry.updatedAt ?? entry.createdAt).getTime();
}

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tamperDetected, setTamperDetected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const syncedRef = useRef(false);
  const syncingRef = useRef(false);
  const drainingRef = useRef(false);

  // Local-only mode — set by SyncBridge from SettingsContext. When true, all
  // cloud sync operations are skipped and entries only live on the device.
  const localOnlyModeRef = useRef(false);
  const [localOnlyMode, setLocalOnlyModeState] = useState(false);
  const setLocalOnlyMode = useCallback((enabled: boolean) => {
    localOnlyModeRef.current = enabled;
    setLocalOnlyModeState(enabled);
  }, []);

  // Encryption context — set by EncryptionBridge below. We track readiness so
  // that initial cloud sync and queue draining wait for the user's passphrase
  // to be loaded; otherwise we could leak plaintext to the cloud or fail to
  // decrypt incoming rows. Declared up here because the syncFromCloud effect
  // observes `cryptoReady` before its declaration order would normally allow.
  const cryptoReadyRef = useRef(false);
  const [cryptoReady, setCryptoReady] = useState(false);
  const cryptoRef = useRef<{ enabled: boolean; passphrase: string; salt: string }>({ enabled: false, passphrase: "", salt: "" });
  const setEncryptionContext = useCallback((enabled: boolean, passphrase: string, salt: string) => {
    cryptoRef.current = { enabled, passphrase, salt };
    // Once the bridge has resolved (either with a passphrase or with
    // encryption disabled) it is safe to drain the offline queue and pull
    // from cloud. Both effects observe `cryptoReady`.
    if (!cryptoReadyRef.current) {
      cryptoReadyRef.current = true;
      setCryptoReady(true);
    }
  }, []);

  // ── #1 E2E Encryption helpers — applied only at the API boundary ──────────
  const encryptForCloud = useCallback((entry: Entry): Entry => {
    const ctx = cryptoRef.current;
    if (!ctx.enabled || !ctx.passphrase) return entry;
    return {
      ...entry,
      title: entry.title ? encryptString(entry.title, ctx.passphrase, ctx.salt) : entry.title,
      note: entry.note ? encryptString(entry.note, ctx.passphrase, ctx.salt) : entry.note,
      aiSummary: entry.aiSummary ? encryptString(entry.aiSummary, ctx.passphrase, ctx.salt) : entry.aiSummary,
    };
  }, []);

  const decryptFromCloud = useCallback((entry: Entry): Entry => {
    const ctx = cryptoRef.current;
    if (!ctx.passphrase) return entry;
    return {
      ...entry,
      title: isEncrypted(entry.title) ? decryptString(entry.title, ctx.passphrase, ctx.salt) : entry.title,
      note: isEncrypted(entry.note) ? decryptString(entry.note, ctx.passphrase, ctx.salt) : entry.note,
      aiSummary: entry.aiSummary && isEncrypted(entry.aiSummary) ? decryptString(entry.aiSummary, ctx.passphrase, ctx.salt) : entry.aiSummary,
    };
  }, []);

  // ── #7 Network state ─────────────────────────────────────────────────────
  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
    return () => sub();
  }, []);

  const refreshPendingCount = useCallback(async () => {
    setPendingSyncCount(await queueLength());
  }, []);
  useEffect(() => { void refreshPendingCount(); }, [refreshPendingCount]);

  const apiFetch = useCallback(async (path: string, options: RequestInit = {}): Promise<Response> => {
    const base = getRestApiBase();
    if (!base) {
      warnMissingNativeDomainOnce();
      throw new Error("REST_API_NOT_CONFIGURED");
    }
    const token = await getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    };
    return fetch(`${base}/entries${path}`, { ...options, headers });
  }, [getToken]);

  const persistLocal = useCallback(async (newEntries: Entry[]) => {
    // On writes, every entry comes from in-app code so we don't expect any to be
    // missing hashes — but allow legacy entries to migrate. Never *clear* the
    // tamper flag here; only the explicit acknowledge path can clear it.
    const { entries: chained, tampered } = computeChain(newEntries, true);
    setEntries(chained);
    if (tampered) {
      setTamperDetected(true);
      await AsyncStorage.setItem(TAMPER_KEY, "1");
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chained));
  }, []);

  const loadLocal = useCallback(async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [] as Entry[];
    try {
      return JSON.parse(data) as Entry[];
    } catch {
      return [] as Entry[];
    }
  }, []);

  const mergeEntries = useCallback((localEntries: Entry[], cloudEntries: Entry[]) => {
    const merged = new Map<string, Entry>();
    for (const entry of cloudEntries) merged.set(entry.id, entry);
    for (const local of localEntries) {
      const existing = merged.get(local.id);
      if (!existing) {
        merged.set(local.id, local);
        continue;
      }
      merged.set(local.id, entryTimestamp(local) >= entryTimestamp(existing) ? local : existing);
    }
    return [...merged.values()].sort((a, b) => entryTimestamp(b) - entryTimestamp(a));
  }, []);

  const syncFromCloud = useCallback(async () => {
    if (localOnlyModeRef.current) return;
    if (syncingRef.current) return;
    if (!getRestApiBase()) {
      warnMissingNativeDomainOnce();
      setSyncError("Cloud sync needs EXPO_PUBLIC_DOMAIN in .env (host only, e.g. api.example.com).");
      return;
    }
    syncingRef.current = true;
    setSyncing(true);
    setSyncError(null);
    try {
      const localEntries = await loadLocal();
      const res = await apiFetch("/");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { entries: rows } = (await res.json()) as { entries: Record<string, unknown>[] };
      const cloudEntries = rows.map(dbRowToEntry).map(decryptFromCloud);
      const merged = mergeEntries(localEntries, cloudEntries);
      await persistLocal(merged);
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : "";
      setSyncError(
        code === "REST_API_NOT_CONFIGURED"
          ? "Cloud sync needs EXPO_PUBLIC_DOMAIN in .env (host only, e.g. api.example.com)."
          : "Could not sync. Changes saved locally.",
      );
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [apiFetch, loadLocal, mergeEntries, persistLocal]);

  useEffect(() => {
    void (async () => {
      const data = await loadLocal();
      const persistedFlag = await AsyncStorage.getItem(TAMPER_KEY);
      if (data.length) {
        // Legacy migration: if NO entry has a hash, treat as first-time init (no tamper).
        const anyHashed = data.some((e) => !!e.hash);
        const { entries: chained, tampered } = computeChain(data, !anyHashed);
        setEntries(chained);
        const isTampered = tampered || persistedFlag === "1";
        setTamperDetected(isTampered);
        if (tampered) await AsyncStorage.setItem(TAMPER_KEY, "1");
        // Persist back so all entries acquire a hash going forward (one-time migration only).
        if (!anyHashed) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chained));
      } else if (persistedFlag === "1") {
        setTamperDetected(true);
      }
    })();
  }, [loadLocal]);

  useEffect(() => {
    if (!isSignedIn) {
      syncedRef.current = false;
      return;
    }
    if (localOnlyMode) {
      // Reset so that turning cloud sync back on triggers a fresh pull.
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;
    if (!cryptoReady) return; // wait for EncryptionBridge so decryption works
    syncedRef.current = true;
    void syncFromCloud();
  }, [isSignedIn, localOnlyMode, cryptoReady, syncFromCloud]);

  // ── #7 Sync queue: enqueue + drain ─────────────────────────────────────
  const drainQueue = useCallback(async () => {
    if (localOnlyModeRef.current) return;
    if (drainingRef.current) return;
    if (!getRestApiBase()) return;
    if (!online) return;
    if (!cryptoReadyRef.current) return;
    drainingRef.current = true;
    try {
      const ops = await readQueue();
      const processed = new Set<string>();
      const retryOps: SyncOp[] = [];
      for (const op of ops) {
        let transient = false;
        try {
          let res: Response;
          if (op.op === "create") {
            res = await apiFetch("/", { method: "POST", body: JSON.stringify(op.payload) });
          } else if (op.op === "update") {
            res = await apiFetch(`/${op.entryId}`, { method: "PUT", body: JSON.stringify(op.payload) });
          } else {
            res = await apiFetch(`/${op.entryId}`, { method: "DELETE" });
          }
          // Treat 5xx and 429 (rate limit) as transient, retry. 401 is also
          // worth retrying once auth refreshes. Everything else (2xx success
          // or terminal 4xx like 400/404/409/422) is considered processed.
          transient = res.status >= 500 || res.status === 429 || res.status === 401;
        } catch {
          transient = true; // network error
        }
        if (transient) {
          if (op.attempts < 5) retryOps.push({ ...op, attempts: op.attempts + 1 });
          else processed.add(op.id); // terminal drop after 6 total attempts
        } else {
          processed.add(op.id);
        }
      }
      const remaining = await replaceProcessed(processed, retryOps);
      setPendingSyncCount(remaining);
    } finally {
      drainingRef.current = false;
    }
  }, [online, apiFetch]);

  useEffect(() => { if (!localOnlyMode && online && cryptoReady) void drainQueue(); }, [localOnlyMode, online, cryptoReady, drainQueue]);

  const syncEntry = useCallback(async (entry: Entry) => {
    if (localOnlyModeRef.current) return;
    const payload = encryptForCloud(entry);
    await enqueue({ op: "create", entryId: entry.id, payload });
    await refreshPendingCount();
    void drainQueue();
  }, [encryptForCloud, drainQueue, refreshPendingCount]);

  const syncUpdate = useCallback(async (entryId: string, payload: Record<string, unknown>) => {
    if (localOnlyModeRef.current) return;
    // Encrypt mutable fields if present.
    const ctx = cryptoRef.current;
    let p = payload;
    if (ctx.enabled && ctx.passphrase) {
      p = { ...payload };
      if (typeof p.title === "string") p.title = encryptString(p.title, ctx.passphrase, ctx.salt);
      if (typeof p.note === "string") p.note = encryptString(p.note, ctx.passphrase, ctx.salt);
      if (typeof p.aiSummary === "string") p.aiSummary = encryptString(p.aiSummary, ctx.passphrase, ctx.salt);
    }
    await enqueue({ op: "update", entryId, payload: p });
    await refreshPendingCount();
    void drainQueue();
  }, [drainQueue, refreshPendingCount]);

  const syncDelete = useCallback(async (entryId: string) => {
    if (localOnlyModeRef.current) return;
    await enqueue({ op: "delete", entryId });
    await refreshPendingCount();
    void drainQueue();
  }, [drainQueue, refreshPendingCount]);

  const addEntry = useCallback(async (data: Omit<Entry, "id" | "createdAt" | "aiSummary"> & { createdAt?: string }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const { createdAt: customDate, ...rest } = data;
    const entry: Entry = { ...rest, id, createdAt: customDate ?? new Date().toISOString(), aiSummary: null };
    await persistLocal([entry, ...entries]);
    void syncEntry(entry);
    return id;
  }, [entries, persistLocal, syncEntry]);

  // Soft-delete: mark as trashed locally; sync remotely as an update so the
  // entry continues to exist on the server until the user empties the trash
  // (or until the 30-day auto-purge fires).
  const deleteEntry = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    const updated = entries.map((e) => (e.id === id ? { ...e, trashedAt: now, pinned: false, updatedAt: now } : e));
    const next = updated.find((e) => e.id === id);
    await persistLocal(updated);
    if (next) void syncUpdate(id, { trashedAt: now, pinned: false, updatedAt: now });
  }, [entries, persistLocal, syncUpdate]);

  const restoreEntry = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    const updated = entries.map((e) => {
      if (e.id !== id) return e;
      const { trashedAt: _t, ...rest } = e;
      return { ...rest, updatedAt: now } as Entry;
    });
    await persistLocal(updated);
    void syncUpdate(id, { trashedAt: null, updatedAt: now });
  }, [entries, persistLocal, syncUpdate]);

  const permanentlyDelete = useCallback(async (id: string) => {
    await persistLocal(entries.filter((e) => e.id !== id));
    void syncDelete(id);
  }, [entries, persistLocal, syncDelete]);

  const emptyTrash = useCallback(async () => {
    const trashed = entries.filter((e) => !!e.trashedAt);
    await persistLocal(entries.filter((e) => !e.trashedAt));
    for (const e of trashed) void syncDelete(e.id);
  }, [entries, persistLocal, syncDelete]);

  // Auto-purge entries that have been in trash for more than 30 days. Re-runs
  // whenever `entries` changes so the latest snapshot is always inspected; the
  // effect early-returns when nothing is expired, so the cost is a single
  // filter pass per change.
  useEffect(() => {
    const cutoff = Date.now() - TRASH_TTL_DAYS * 24 * 60 * 60 * 1000;
    const expired = entries.filter((e) => e.trashedAt && new Date(e.trashedAt).getTime() < cutoff);
    if (expired.length === 0) return;
    const expiredIds = new Set(expired.map((e) => e.id));
    void (async () => {
      const remaining = entries.filter((e) => !expiredIds.has(e.id));
      await persistLocal(remaining);
      for (const id of expiredIds) void syncDelete(id);
    })();
  }, [entries, persistLocal, syncDelete]);

  const deleteAllEntries = useCallback(async () => {
    await persistLocal([]);
    try {
      await apiFetch("/", { method: "DELETE" });
    } catch {
      // Local data is already cleared; cloud wipe may fail when offline or EXPO_PUBLIC_DOMAIN is unset.
    }
  }, [apiFetch, persistLocal]);

  const clearLocalEntries = useCallback(async () => {
    await persistLocal([]);
  }, [persistLocal]);

  const updateEntry = useCallback(async (id: string, updates: Partial<Pick<Entry, "title" | "note" | "tag" | "photoUri" | "receiptPdfUri" | "receiptVendor" | "receiptLocation" | "receiptAmount" | "receiptCurrency" | "receiptDate" | "receiptExtra" | "mood" | "shareVisibility" | "shareToken" | "commentsEnabled" | "shareComments">>) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e));
    const next = updated.find((e) => e.id === id);
    await persistLocal(updated);
    if (next) void syncUpdate(id, next as unknown as Record<string, unknown>);
  }, [entries, persistLocal, syncUpdate]);

  const toggleLocked = useCallback(async (id: string) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, locked: !(e.locked ?? false), updatedAt: new Date().toISOString() } : e));
    const next = updated.find((e) => e.id === id);
    await persistLocal(updated);
    if (next) void syncUpdate(id, { locked: next.locked, updatedAt: next.updatedAt });
  }, [entries, persistLocal, syncUpdate]);

  const toggleStar = useCallback(async (id: string) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, starred: !(e.starred ?? false), updatedAt: new Date().toISOString() } : e));
    const next = updated.find((e) => e.id === id);
    await persistLocal(updated);
    if (next) void syncUpdate(id, { starred: next.starred, updatedAt: next.updatedAt });
  }, [entries, persistLocal, syncUpdate]);

  // #6 Pin / unpin — capped at PIN_LIMIT active pins.
  const togglePin = useCallback(async (id: string): Promise<{ ok: boolean; reason?: "limit" }> => {
    const target = entries.find((e) => e.id === id);
    if (!target) return { ok: false };
    const willPin = !(target.pinned ?? false);
    if (willPin) {
      const currentPins = entries.filter((e) => e.pinned && !e.trashedAt).length;
      if (currentPins >= PIN_LIMIT) return { ok: false, reason: "limit" };
    }
    const now = new Date().toISOString();
    const updated = entries.map((e) => (e.id === id ? { ...e, pinned: willPin, updatedAt: now } : e));
    await persistLocal(updated);
    void syncUpdate(id, { pinned: willPin, updatedAt: now });
    return { ok: true };
  }, [entries, persistLocal, syncUpdate]);

  // #8 Cascade tag rename across all entries (active + trashed).
  const renameTagEverywhere = useCallback(async (oldLabel: string, newLabel: string) => {
    if (!oldLabel || !newLabel || oldLabel === newLabel) return;
    const now = new Date().toISOString();
    const affected: Entry[] = [];
    const updated = entries.map((e) => {
      if (e.tag !== oldLabel) return e;
      const next = { ...e, tag: newLabel as Tag, updatedAt: now };
      affected.push(next);
      return next;
    });
    if (affected.length === 0) return;
    await persistLocal(updated);
    for (const e of affected) void syncUpdate(e.id, { tag: e.tag, updatedAt: now });
  }, [entries, persistLocal, syncUpdate]);

  const mergeTagInto = useCallback(async (sourceLabel: string, targetLabel: string) => {
    await renameTagEverywhere(sourceLabel, targetLabel);
  }, [renameTagEverywhere]);

  const findEntryById = useCallback((id: string | undefined) => {
    if (!id) return undefined;
    return entries.find((e) => e.id === id);
  }, [entries]);

  const linkEntries = useCallback(async (id1: string, id2: string) => {
    const updated = entries.map((e) => {
      if (e.id === id1) return { ...e, relatedIds: [...new Set([...(e.relatedIds ?? []), id2])], updatedAt: new Date().toISOString() };
      if (e.id === id2) return { ...e, relatedIds: [...new Set([...(e.relatedIds ?? []), id1])], updatedAt: new Date().toISOString() };
      return e;
    });
    await persistLocal(updated);
    const a = updated.find((e) => e.id === id1);
    const b = updated.find((e) => e.id === id2);
    if (a) void syncUpdate(id1, { relatedIds: a.relatedIds, updatedAt: a.updatedAt });
    if (b) void syncUpdate(id2, { relatedIds: b.relatedIds, updatedAt: b.updatedAt });
  }, [entries, persistLocal, syncUpdate]);

  const unlinkEntries = useCallback(async (id1: string, id2: string) => {
    const updated = entries.map((e) => {
      if (e.id === id1) return { ...e, relatedIds: (e.relatedIds ?? []).filter((r) => r !== id2), updatedAt: new Date().toISOString() };
      if (e.id === id2) return { ...e, relatedIds: (e.relatedIds ?? []).filter((r) => r !== id1), updatedAt: new Date().toISOString() };
      return e;
    });
    await persistLocal(updated);
    const a = updated.find((e) => e.id === id1);
    const b = updated.find((e) => e.id === id2);
    if (a) void syncUpdate(id1, { relatedIds: a.relatedIds, updatedAt: a.updatedAt });
    if (b) void syncUpdate(id2, { relatedIds: b.relatedIds, updatedAt: b.updatedAt });
  }, [entries, persistLocal, syncUpdate]);

  const importEntries = useCallback(async (imported: Entry[]) => {
    const merged = mergeEntries(imported, entries);
    await persistLocal(merged);
    for (const entry of imported) void syncEntry(entry);
  }, [entries, mergeEntries, persistLocal, syncEntry]);

  // Public `entries` excludes soft-deleted; consumers that need the trash use
  // `trashedEntries`. `findEntryById` walks the full list so the entry detail
  // screen can still resolve a trashed entry the user navigated to from /trash.
  const visibleEntries = entries.filter((e) => !e.trashedAt);
  const trashedEntries = entries.filter((e) => !!e.trashedAt);

  return (
    <EntriesContext.Provider
      value={{
        entries: visibleEntries,
        trashedEntries,
        syncing,
        syncError,
        tamperDetected,
        online,
        pendingSyncCount,
        localOnlyMode,
        setEncryptionContext,
        setLocalOnlyMode,
        addEntry,
        deleteEntry,
        deleteAllEntries,
        clearLocalEntries,
        updateEntry,
        toggleStar,
        toggleLocked,
        togglePin,
        restoreEntry,
        permanentlyDelete,
        emptyTrash,
        findEntryById,
        renameTagEverywhere,
        mergeTagInto,
        linkEntries,
        unlinkEntries,
        importEntries,
        entryCount: visibleEntries.length,
      }}
    >
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntries() {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error("useEntries must be inside EntriesProvider");
  return ctx;
}
