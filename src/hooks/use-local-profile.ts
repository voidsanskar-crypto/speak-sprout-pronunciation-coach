import { isNativeLanguage, type NativeLanguage } from "@/lib/accent-drills";
import { useSyncExternalStore } from "react";

const PROFILE_KEY = "speakup:profile:v1";
const listeners = new Set<() => void>();

export interface Profile {
  name: string;
  email: string;
  nativeLanguage?: NativeLanguage | undefined;
}

let lastStored: string | null = null;
let lastProfile: Profile | null = null;

function getProfile(): Profile | null {
  try {
    const stored = window.localStorage.getItem(PROFILE_KEY);
    if (stored === lastStored) return lastProfile;

    lastStored = stored;
    lastProfile = null;
    if (stored === null) return null;

    const profile = JSON.parse(stored) as {
      name?: unknown;
      email?: unknown;
      nativeLanguage?: unknown;
    } | null;
    if (typeof profile?.name === "string" && profile.name.trim()) {
      lastProfile = {
        name: profile.name.trim(),
        email: typeof profile.email === "string" ? profile.email : "",
        nativeLanguage: isNativeLanguage(profile.nativeLanguage)
          ? profile.nativeLanguage
          : undefined,
      };
    }
    return lastProfile;
  } catch {
    return null;
  }
}

function getServerProfile() {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  function onStorage(event: StorageEvent) {
    if (!event.key || event.key === PROFILE_KEY) listener();
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLocalProfile() {
  return useSyncExternalStore(subscribe, getProfile, getServerProfile);
}

export function saveLocalProfile(profile: Profile) {
  const name = profile.name.trim();
  if (!name) return false;

  try {
    window.localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({ name, email: profile.email.trim(), nativeLanguage: profile.nativeLanguage }),
    );
  } catch {
    return false;
  }
  listeners.forEach((listener) => listener());
  return true;
}

export function clearLocalProfile() {
  try {
    window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    return false;
  }
  listeners.forEach((listener) => listener());
  return true;
}
