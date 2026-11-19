import { useSyncExternalStore } from "react";
import { applyAttempt, DEFAULT_PROGRESS, type ProgressState } from "@/lib/progress";
import type { WordResult } from "@/lib/scoring";

const KEY = "speakup:progress:v1";
const listeners = new Set<() => void>();
let cache: ProgressState | null = null;

function read(): ProgressState {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULT_PROGRESS, ...(JSON.parse(raw) as Partial<ProgressState>) } : DEFAULT_PROGRESS;
  } catch {
    cache = DEFAULT_PROGRESS;
  }
  return cache;
}

function write(next: ProgressState) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Current saved progress (browser only). */
export function getProgressSnapshot(): ProgressState {
  return read();
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_PROGRESS);
}

export function recordAttempt(input: { phraseId: string; score: number; words: WordResult[] }) {
  write(applyAttempt(read(), input, new Date()));
}

export function setTranslationLanguage(language: string | null) {
  write({ ...read(), translationLanguage: language });
}

export function resetProgress() {
  write(DEFAULT_PROGRESS);
}
