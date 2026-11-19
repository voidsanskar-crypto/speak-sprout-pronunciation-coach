export type WordStatus = "correct" | "close" | "missed";

export interface WordResult {
  index: number;
  target: string; // normalized target word
  heard: string | null;
  // Preserve meaningful spelling, such as apostrophes, for pronunciation lookup.
  targetSpelling?: string;
  heardSpelling?: string;
  similarity: number; // 0..1
  status: WordStatus;
}

export interface ScoreResult {
  score: number; // 0..100
  words: WordResult[];
  transcript: string;
  extraWordCount: number;
  extraWords: string[];
}

export const CORRECT_THRESHOLD = 0.8;
export const CLOSE_THRESHOLD = 0.5;

const NUMBER_WORDS: Record<string, string> = {
  "0": "zero",
  "1": "one",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "nine",
  "10": "ten",
};

export function normalizeWord(word: string): string {
  const w = word
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]/g, "");
  return NUMBER_WORDS[w] ?? w;
}

export function pronunciationSpelling(word: string): string {
  return word
    .toLowerCase()
    .replace(/[’‘ʼ]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9'-]/g, "")
    .replace(/^['-]+|['-]+$/g, "");
}

const wordBoundaries = /[\s\-–—]+/;

function scoreTokens(text: string) {
  return text
    .split(wordBoundaries)
    .map((part) => ({ normalized: normalizeWord(part), spelling: pronunciationSpelling(part) }))
    .filter((word) => word.normalized);
}

export function tokenize(text: string): string[] {
  return text.split(wordBoundaries).map(normalizeWord).filter(Boolean);
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
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
    }
    prev = cur;
  }
  return prev[b.length]!;
}

// A small set of spelling variants that speech recognizers commonly interchange.
const SPELLING_VARIANTS: ReadonlyMap<string, string> = new Map([
  ["colour", "color"],
  ["favourite", "favorite"],
  ["flavour", "flavor"],
  ["centre", "center"],
  ["theatre", "theater"],
  ["travelling", "traveling"],
  ["travelled", "traveled"],
]);

export function wordSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const target = SPELLING_VARIANTS.get(a) ?? a;
  const heard = SPELLING_VARIANTS.get(b) ?? b;
  if (target === heard) return 1;

  const similarity = 1 - levenshtein(target, heard) / Math.max(target.length, heard.length);
  // Similar spelling can earn partial credit but should never show as a match.
  return Math.min(similarity, 0.75);
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
  const target = scoreTokens(targetText);
  const heard = scoreTokens(transcript);
  const n = target.length;
  const m = heard.length;
  const GAP = 1;

  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const move: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    cost[i]![0]! = i * GAP;
    move[i]![0]! = 1;
  }
  for (let j = 1; j <= m; j++) {
    cost[0]![j]! = j * GAP * 0.6;
    move[0]![j]! = 2;
  }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sub =
        cost[i - 1]![j - 1]! +
        (1 - wordSimilarity(target[i - 1]!.normalized, heard[j - 1]!.normalized)) * 1.5;
      const del = cost[i - 1]![j]! + GAP; // target word missed
      const ins = cost[i]![j - 1]! + GAP * 0.6; // extra heard word
      if (sub <= del && sub <= ins) {
        cost[i]![j]! = sub;
        move[i]![j]! = 0;
      } else if (del <= ins) {
        cost[i]![j]! = del;
        move[i]![j]! = 1;
      } else {
        cost[i]![j]! = ins;
        move[i]![j]! = 2;
      }
    }
  }

  const matched: ((typeof heard)[number] | null)[] = new Array(n).fill(null);
  const extraWords: string[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const mv = i === 0 ? 2 : j === 0 ? 1 : move[i]![j]!;
    if (mv === 0) {
      matched[i - 1] = heard[j - 1]!;
      i--;
      j--;
    } else if (mv === 1) {
      i--;
    } else {
      extraWords.push(heard[j - 1]!.spelling || heard[j - 1]!.normalized);
      j--;
    }
  }

  const words: WordResult[] = target.map((expected, idx) => {
    const recognized = matched[idx];
    const similarity = recognized ? wordSimilarity(expected.normalized, recognized.normalized) : 0;
    return {
      index: idx,
      target: expected.normalized,
      heard: recognized?.normalized ?? null,
      ...(expected.spelling && expected.spelling !== expected.normalized
        ? { targetSpelling: expected.spelling }
        : {}),
      ...(recognized?.spelling && recognized.spelling !== recognized.normalized
        ? { heardSpelling: recognized.spelling }
        : {}),
      similarity,
      status: statusFor(similarity),
    };
  });

  const total = words.reduce((s, w) => s + w.similarity, 0);
  const raw = n === 0 ? 0 : (total / (n + extraWords.length * 0.25)) * 100;
  return {
    score: Math.round(Math.max(0, Math.min(100, raw))),
    words,
    transcript,
    extraWordCount: extraWords.length,
    extraWords: extraWords.reverse(),
  };
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
  if (score >= 90) return "Excellent match";
  if (score >= 75) return "Strong match";
  if (score >= 55) return "Partial match";
  return "Keep practicing";
}
