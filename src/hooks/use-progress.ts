import { useSyncExternalStore } from "react";
import {
  addPlanWords,
  applyAttempt,
  DEFAULT_PROGRESS,
  queueTroubleWords,
  reviewWord,
  toDateKey,
  type ProgressState,
} from "@/lib/progress";
import type { WordResult } from "@/lib/scoring";

const KEY = "speakup:progress:v1";
const listeners = new Set<() => void>();
let cache: ProgressState | null = null;
let resetEpoch = 0;

function read(): ProgressState {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw
      ? { ...DEFAULT_PROGRESS, ...(JSON.parse(raw) as Partial<ProgressState>) }
      : DEFAULT_PROGRESS;
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
  recordSoundEvidence(input.words);
}

export function recordTroubleWords(words: WordResult[]) {
  const state = read();
  const reviewDeck = queueTroubleWords(state.reviewDeck, words, toDateKey(new Date()));
  if (reviewDeck !== state.reviewDeck) write({ ...state, reviewDeck });
  recordSoundEvidence(words);
}

export function reviewDeckWord(word: string, remembered: boolean) {
  const state = read();
  const reviewDeck = reviewWord(state.reviewDeck, word, remembered, toDateKey(new Date()));
  if (reviewDeck !== state.reviewDeck) write({ ...state, reviewDeck });
}

export function setTranslationLanguage(language: string | null) {
  write({ ...read(), translationLanguage: language });
}

export function resetProgress() {
  resetEpoch++;
  write(DEFAULT_PROGRESS);
}

export function awardXp(amount: number) {
  const state = read();
  write({ ...state, xp: state.xp + amount });
}

export function recordSoundEvidence(words: WordResult[]) {
  const epoch = resetEpoch;
  void import("@/lib/phoneme-review")
    .then(({ soundEvidence }) => {
      if (epoch !== resetEpoch) return;
      const evidence = soundEvidence(words);
      if (!evidence.length) return;
      const state = read();
      const phonemeMatches = { ...state.phonemeMatches };
      for (const { phone, different } of evidence) {
        const stat = phonemeMatches[phone] ?? { attempts: 0, total: 0 };
        phonemeMatches[phone] = {
          attempts: stat.attempts + 1,
          total: stat.total + (different ? 0 : 100),
        };
      }
      write({ ...state, phonemeMatches });
    })
    .catch(() => {
      // Word match and Review Deck still work if the optional dictionary chunk is unavailable.
    });
}

export function addTrainingWords(words: readonly string[]) {
  if (!words.length) return;
  const state = read();
  write({ ...state, reviewDeck: addPlanWords(state.reviewDeck, words, toDateKey(new Date())) });
}
