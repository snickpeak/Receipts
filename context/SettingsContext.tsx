import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { Tag } from "./EntriesContext";
import { secureGetAsync, secureSetAsync } from "@/lib/secureStorageCompat";
import { DEFAULT_TAGS, type CustomTag } from "@/lib/tagsLib";

const SECURE_FIELDS: (keyof Settings)[] = ["pin", "decoyPin", "backupPassphrase"];
const SECURE_KEY = "receipts_secure_v1";

export interface RecurringPrompt {
  id: string;
  text: string;
  tag: Tag;
  enabled: boolean;
}

export interface Settings {
  // Existing
  lockEnabled: boolean;
  biometricEnabled: boolean;
  pin: string;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  recurringPrompts: RecurringPrompt[];

  // Auto-lock (seconds: 0=immediately, 30, 60, 300, -1=never)
  autoLockTimeout: number;

  // Decoy mode — second PIN that shows an empty/clean app
  decoyPin: string;

  // Privacy
  localOnlyMode: boolean;
  screenshotProtection: boolean;
  stripMetadata: boolean;

  // Appearance
  appearanceMode: "system" | "light" | "dark";
  fontColor: string;

  // Language & locale
  language: string;
  currency: string;

  // Recovery codes (hashed with simple djb2)
  recoveryCodeHashes: string[];

  // Anomaly tracking
  failedAttempts: number;
  lastUnlockTime: string;

  // Encrypted backup passphrase
  backupPassphrase: string;

  // Local preview-only access
  guestPassEnabled: boolean;

  // Panic gesture — shake device to lock instantly
  panicShakeEnabled: boolean;

  // Auto-wipe after N consecutive failed unlocks (0 = disabled)
  wipeAfterFails: number;

  // Per-entry biometric lock — each "locked" entry requires fresh biometrics
  perEntryLockEnabled: boolean;

  // Customizable tags — overrides/extends DEFAULT_TAGS
  customTags: CustomTag[];

  // #1 — End-to-end encryption for cloud sync
  e2eEncryptionEnabled: boolean;
  encryptionSalt: string;

  // #18 — Geo-tagging for entries (opt-in, off by default for privacy)
  geoTaggingEnabled: boolean;

  // Date & time display
  timezone: string;
  homeLocation: string;
  /** Parsed from search or legacy "City, Country" line */
  homeCity: string;
  homeCountry: string;

  // Accessibility
  reduceMotion: boolean;
  hapticsEnabled: boolean;
}

const DEFAULT_PROMPTS: RecurringPrompt[] = [
  { id: "weekly-win", text: "What was your biggest win this week?", tag: "Win", enabled: false },
  { id: "money-check", text: "Log your weekly finances", tag: "Money", enabled: false },
  { id: "promise-check", text: "Did you keep your promises this week?", tag: "Promise", enabled: false },
  { id: "daily-memory", text: "What happened today worth remembering?", tag: "Memory", enabled: false },
];

const DEFAULT_SETTINGS: Settings = {
  lockEnabled: false,
  biometricEnabled: false,
  pin: "",
  reminderEnabled: false,
  reminderHour: 20,
  reminderMinute: 0,
  recurringPrompts: DEFAULT_PROMPTS,
  autoLockTimeout: 60,
  decoyPin: "",
  localOnlyMode: false,
  screenshotProtection: false,
  stripMetadata: true,
  appearanceMode: "light",
  fontColor: "",
  language: "en",
  currency: "USD",
  recoveryCodeHashes: [],
  failedAttempts: 0,
  lastUnlockTime: "",
  backupPassphrase: "",
  guestPassEnabled: false,
  panicShakeEnabled: false,
  wipeAfterFails: 0,
  perEntryLockEnabled: false,
  customTags: DEFAULT_TAGS,
  e2eEncryptionEnabled: false,
  encryptionSalt: "",
  geoTaggingEnabled: false,
  timezone: "",
  homeLocation: "",
  homeCity: "",
  homeCountry: "",
  reduceMotion: false,
  hapticsEnabled: true,
};

const SETTINGS_KEY = "receipts_settings_v2";

interface SettingsContextType {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  loaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [data, secureRaw] = await Promise.all([
          AsyncStorage.getItem(SETTINGS_KEY),
          secureGetAsync(SECURE_KEY),
        ]);
        let merged = { ...DEFAULT_SETTINGS };
        if (data) {
          try {
            const parsed = JSON.parse(data) as Partial<Settings>;
            merged = { ...merged, ...parsed };
            const loc = typeof merged.homeLocation === "string" ? merged.homeLocation.trim() : "";
            if (loc && !merged.homeCity && !merged.homeCountry) {
              const idx = loc.lastIndexOf(",");
              if (idx > 0) {
                const cityPart = loc.slice(0, idx).trim();
                const countryPart = loc.slice(idx + 1).trim();
                if (cityPart && countryPart) {
                  merged = { ...merged, homeCity: cityPart, homeCountry: countryPart };
                }
              }
            }
          } catch {}
        }
        if (secureRaw) {
          try {
            const secure = JSON.parse(secureRaw) as Partial<Settings>;
            for (const key of SECURE_FIELDS) {
              if (secure[key] !== undefined) (merged as any)[key] = secure[key];
            }
          } catch {}
        } else if (merged.pin || merged.decoyPin || merged.backupPassphrase) {
          const secureData: Record<string, string> = {};
          for (const key of SECURE_FIELDS) {
            if (merged[key]) secureData[key] = merged[key] as string;
          }
          await secureSetAsync(SECURE_KEY, JSON.stringify(secureData));
          const sanitized = { ...merged };
          for (const key of SECURE_FIELDS) (sanitized as any)[key] = "";
          await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitized));
        }
        setSettings(merged);
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
      setLoaded(true);
    })();
  }, []);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      const forAsync = { ...next };
      const secureData: Record<string, string> = {};
      for (const key of SECURE_FIELDS) {
        secureData[key] = (next as any)[key] ?? "";
        (forAsync as any)[key] = "";
      }
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(forAsync));
      void secureSetAsync(SECURE_KEY, JSON.stringify(secureData));
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}

// ── Utilities exported for use across the app ─────────────────────────────────

/** djb2 hash for recovery codes — fast, pure JS */
export function hashCode(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Generate a human-readable 8-char recovery code */
export function generateRecoveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/** AES-256 encrypt data with passphrase via PBKDF2 key derivation */
export function backupEncrypt(data: string, passphrase: string): string {
  if (!passphrase) return data;
  const { encryptString, generateSalt } = require("@/lib/cryptoLib") as typeof import("@/lib/cryptoLib");
  const salt = generateSalt();
  const encrypted = encryptString(data, passphrase, salt);
  return JSON.stringify({ s: salt, c: encrypted });
}

/** AES-256 decrypt data with passphrase via PBKDF2 key derivation */
export function backupDecrypt(encoded: string, passphrase: string): string {
  if (!passphrase) return encoded;
  const { decryptString } = require("@/lib/cryptoLib") as typeof import("@/lib/cryptoLib");
  try {
    const { s: salt, c: ciphertext } = JSON.parse(encoded) as { s: string; c: string };
    return decryptString(ciphertext, passphrase, salt);
  } catch {
    return encoded;
  }
}

/** @deprecated Use backupEncrypt instead — kept only for reading legacy backups */
export function xorDecrypt(encoded: string, passphrase: string): string {
  if (!passphrase) return encoded;
  try {
    const data = decodeURIComponent(escape(atob(encoded)));
    let result = "";
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ passphrase.charCodeAt(i % passphrase.length));
    }
    return result;
  } catch { return encoded; }
}
