import CryptoJS from "crypto-js";

const VERSION_PREFIX = "ENC1::";

function deriveKey(passphrase: string, salt: string): string {
  return CryptoJS.PBKDF2(passphrase, salt, { keySize: 256 / 32, iterations: 4096 }).toString();
}

export function encryptString(plaintext: string, passphrase: string, salt: string): string {
  if (!plaintext) return plaintext;
  if (!passphrase) return plaintext;
  const key = deriveKey(passphrase, salt);
  const cipher = CryptoJS.AES.encrypt(plaintext, key).toString();
  return VERSION_PREFIX + cipher;
}

export function decryptString(value: string, passphrase: string, salt: string): string {
  if (!value || !value.startsWith(VERSION_PREFIX)) return value;
  if (!passphrase) return value;
  try {
    const key = deriveKey(passphrase, salt);
    const cipher = value.slice(VERSION_PREFIX.length);
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    return text || value;
  } catch {
    return value;
  }
}

export function isEncrypted(value: string | undefined | null): boolean {
  return !!value && value.startsWith(VERSION_PREFIX);
}

export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}
