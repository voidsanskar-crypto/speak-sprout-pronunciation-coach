export type WordStatus = "correct" | "close" | "missed";

export interface WordResult {
  index: number;
  target: string; // normalized target word
  heard: string | null;
  similarity: number; // 0..1
  status: WordStatus;
}

export interface ScoreResult {
  score: number; // 0..100
  words: WordResult[];
  transcript: string;
}

export const CORRECT_THRESHOLD = 0.8;
export const CLOSE_THRESHOLD = 0.5;

const NUMBER_WORDS: Record<string, string> = {
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
  "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
};

export function normalizeWord(word: string): string {
  const w = word.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]/g, "");
  return NUMBER_WORDS[w] ?? w;
}

export function tokenize(text: string): string[] {
  return text
    .split(/[\s\-–—]+/)
    .map(normalizeWord)
    .filter(Boolean);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Rough sound-alike key so spelling variants ("color"/"colour") still match. */
function phoneticKey(w: string): string {
  return w
    .replace(/ph/g, "f")
    .replace(/ck/g, "k")
    .replace(/c(?=[eiy])/g, "s")
    .replace(/c/g, "k")
    .replace(/q/g, "k")
    .replace(/x/g, "ks")
    .replace(/z/g, "s")
    .replace(/(.)\1+/g, "$1")
    .replace(/(?!^)[aeiouy]+/g, "a");
}

export function wordSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const ratio = (x: string, y: string) => 1 - levenshtein(x, y) / Math.max(x.length, y.length);
  const direct = ratio(a, b);
  const phon = ratio(phoneticKey(a), phoneticKey(b)) * 0.9;
  return Math.max(0, Math.min(1, Math.max(direct, phon)));
}

export function statusFor(similarity: number): WordStatus {
  if (similarity >= CORRECT_THRESHOLD) return "correct";
  if (similarity >= CLOSE_THRESHOLD) return "close";
  return "missed";
}

/**
 * Align target words with recognized words (global alignment), then score each
 * target word by its matched word's similarity.
 */
export function scoreTranscript(targetText: string, transcript: string): ScoreResult {
  const target = tokenize(targetText);
  const heard = tokenize(transcript);
  const n = target.length;
  const m = heard.length;
  const GAP = 1;

  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const move: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    cost[i][0] = i * GAP;
    move[i][0] = 1;
  }
  for (let j = 1; j <= m; j++) {
    cost[0][j] = j * GAP * 0.6;
    move[0][j] = 2;
  }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sub = cost[i - 1][j - 1] + (1 - wordSimilarity(target[i - 1], heard[j - 1])) * 1.5;
      const del = cost[i - 1][j] + GAP; // target word missed
      const ins = cost[i][j - 1] + GAP * 0.6; // extra heard word
      if (sub <= del && sub <= ins) {
        cost[i][j] = sub;
        move[i][j] = 0;
      } else if (del <= ins) {
        cost[i][j] = del;
        move[i][j] = 1;
      } else {
        cost[i][j] = ins;
        move[i][j] = 2;
      }
    }
  }

  const matched: (string | null)[] = new Array(n).fill(null);
  let extras = 0;
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const mv = i === 0 ? 2 : j === 0 ? 1 : move[i][j];
    if (mv === 0) {
      matched[i - 1] = heard[j - 1];
      i--;
      j--;
    } else if (mv === 1) {
      i--;
    } else {
      extras++;
      j--;
    }
  }

  const words: WordResult[] = target.map((t, idx) => {
    const h = matched[idx];
    const similarity = h ? wordSimilarity(t, h) : 0;
    return { index: idx, target: t, heard: h, similarity, status: statusFor(similarity) };
  });

  const total = words.reduce((s, w) => s + w.similarity, 0);
  const raw = n === 0 ? 0 : (total / (n + extras * 0.25)) * 100;
  return { score: Math.round(Math.max(0, Math.min(100, raw))), words, transcript };
}

/** Pick the recognition alternative that scores best against the target. */
export function scoreBest(targetText: string, alternatives: string[]): ScoreResult {
  const candidates = alternatives.filter((a) => a.trim().length > 0);
  if (candidates.length === 0) return scoreTranscript(targetText, "");
  return candidates
    .map((alt) => scoreTranscript(targetText, alt))
    .reduce((best, r) => (r.score > best.score ? r : best));
}

export function scoreLabel(score: number): string {
  if (score >= 90) return "Native-like!";
  if (score >= 75) return "Great job";
  if (score >= 55) return "Getting there";
  return "Keep practicing";
}
