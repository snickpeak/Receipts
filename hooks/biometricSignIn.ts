import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

import { secureDeleteAsync, secureGetAsync, secureSetAsync } from "@/lib/secureStorageCompat";

const BIOMETRIC_KEY = "receipts_biometric_signin_v1";

export interface BiometricCredentials {
  email: string;
  password: string;
}

export async function getBiometricCredentials(): Promise<BiometricCredentials | null> {
  if (Platform.OS === "web") return null;
  try {
    const raw = await secureGetAsync(BIOMETRIC_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BiometricCredentials;
  } catch {
    return null;
  }
}

export async function saveBiometricCredentials(creds: BiometricCredentials): Promise<void> {
  if (Platform.OS === "web") return;
  await secureSetAsync(BIOMETRIC_KEY, JSON.stringify(creds));
}

export async function clearBiometricCredentials(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await secureDeleteAsync(BIOMETRIC_KEY);
  } catch {
  }
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

export async function promptBiometric(reason: string): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: "Use password",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return result.success === true;
  } catch {
    return false;
  }
}

export async function getBiometricType(): Promise<"face" | "fingerprint" | null> {
  if (Platform.OS === "web") return null;
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return "face";
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return "fingerprint";
    return null;
  } catch {
    return null;
  }
}

export function getBiometricLabel(type: "face" | "fingerprint" | null): string {
  if (type === "face") return Platform.OS === "ios" ? "Face ID" : "Face Recognition";
  if (type === "fingerprint") return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
  return "Biometrics";
}

export function getBiometricIcon(type: "face" | "fingerprint" | null): "eye" | "cpu" {
  return type === "face" ? "eye" : "cpu";
}
