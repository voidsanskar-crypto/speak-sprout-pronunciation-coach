import type { SoundId } from "./sounds";
import { detectSounds } from "./sounds";
import type { WordResult } from "./scoring";

export const DAILY_GOAL = 10;
export const MASTERED_SCORE = 85;
export const MAX_ATTEMPTS_STORED = 3000;

export interface Attempt {
  phraseId: string;
  score: number;
  date: string; // YYYY-MM-DD (local)
  ts: number;
}

export interface SoundStat {
  attempts: number;
  total: number; // sum of word scores 0..100
}

export interface ProgressState {
  version: 1;
  xp: number;
  streak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  attempts: Attempt[];
  best: Record<string, number>;
  sounds: Partial<Record<SoundId, SoundStat>>;
  goalDates: string[];
  translationLanguage: string | null;
}

export const DEFAULT_PROGRESS: ProgressState = {
  version: 1,
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  attempts: [],
  best: {},
  sounds: {},
  goalDates: [],
  translationLanguage: null,
};

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return toDateKey(date);
}

export function xpForScore(score: number): number {
  return Math.round(score / 10) + (score >= 90 ? 5 : 0);
}

/** Streak still alive if last practice was today or yesterday. */
export function currentStreak(state: ProgressState, today: string): number {
  if (!state.lastActiveDate) return 0;
  if (state.lastActiveDate === today || state.lastActiveDate === addDays(today, -1)) {
    return state.streak;
  }
  return 0;
}

export function phrasesDoneOn(state: ProgressState, date: string): number {
  return new Set(state.attempts.filter((a) => a.date === date).map((a) => a.phraseId)).size;
}

export function masteredIds(state: ProgressState): string[] {
  return Object.entries(state.best)
    .filter(([, s]) => s >= MASTERED_SCORE)
    .map(([id]) => id);
}

export function applyAttempt(
  state: ProgressState,
  input: { phraseId: string; score: number; words: Pick<WordResult, "target" | "similarity">[] },
  now: Date,
): ProgressState {
  const today = toDateKey(now);
  let streak = state.streak;
  if (state.lastActiveDate === today) {
    streak = Math.max(1, streak);
  } else if (state.lastActiveDate === addDays(today, -1)) {
    streak = streak + 1;
  } else {
    streak = 1;
  }

  const sounds = { ...state.sounds };
  for (const w of input.words) {
    for (const s of detectSounds(w.target)) {
      const prev = sounds[s] ?? { attempts: 0, total: 0 };
      sounds[s] = { attempts: prev.attempts + 1, total: prev.total + Math.round(w.similarity * 100) };
    }
  }

  const attempts = [
    ...state.attempts,
    { phraseId: input.phraseId, score: input.score, date: today, ts: now.getTime() },
  ].slice(-MAX_ATTEMPTS_STORED);

  const best = { ...state.best };
  best[input.phraseId] = Math.max(best[input.phraseId] ?? 0, input.score);

  const next: ProgressState = {
    ...state,
    xp: state.xp + xpForScore(input.score),
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    lastActiveDate: today,
    attempts,
    best,
    sounds,
  };
  if (phrasesDoneOn(next, today) >= DAILY_GOAL && !next.goalDates.includes(today)) {
    next.goalDates = [...next.goalDates, today];
  }
  return next;
}

export function soundAverage(stat: SoundStat | undefined): number | null {
  if (!stat || stat.attempts === 0) return null;
  return Math.round(stat.total / stat.attempts);
}

/** Weakest sounds first; only sounds with at least `minAttempts` samples. */
export function weakestSounds(
  state: ProgressState,
  minAttempts = 3,
): { id: SoundId; average: number; attempts: number }[] {
  return (Object.entries(state.sounds) as [SoundId, SoundStat][])
    .filter(([, s]) => s.attempts >= minAttempts)
    .map(([id, s]) => ({ id, average: Math.round(s.total / s.attempts), attempts: s.attempts }))
    .sort((a, b) => a.average - b.average);
}

export function lastNDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}
