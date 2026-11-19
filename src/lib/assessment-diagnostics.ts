import { VOWEL_PHONES, type CoachedSound } from "./phonemes";
import { soundEvidence } from "./phoneme-review";
import { tokenize, type ScoreResult } from "./scoring";

type Take = { score: ScoreResult; speakingMs: number | null };

export function diagnosticReport(takes: readonly Take[]) {
  const evidence = soundEvidence(takes.flatMap(({ score }) => score.words));
  function matchRate(vowels: boolean) {
    const group = evidence.filter(({ phone }) => VOWEL_PHONES.has(phone) === vowels);
    return group.length
      ? Math.round((100 * group.filter(({ different }) => !different).length) / group.length)
      : null;
  }

  const flags = new Map<CoachedSound, { phone: CoachedSound; count: number; words: Set<string> }>();
  for (const { phone, different, word } of evidence) {
    if (!different) continue;
    const flag = flags.get(phone) ?? { phone, count: 0, words: new Set<string>() };
    flag.count++;
    flag.words.add(word);
    flags.set(phone, flag);
  }
  const top = [...flags.values()].sort((a, b) => b.count - a.count).slice(0, 3);
  const timed = takes.filter(({ speakingMs }) => speakingMs !== null && speakingMs >= 500);
  const spokenWords = timed.reduce((sum, { score }) => sum + tokenize(score.transcript).length, 0);
  const totalMs = timed.reduce((sum, { speakingMs }) => sum + (speakingMs ?? 0), 0);
  const reviewWords = new Set([
    ...top.flatMap(({ words }) => [...words]),
    ...takes.flatMap(({ score }) =>
      score.words.filter(({ similarity }) => similarity < 0.7).map(({ target }) => target),
    ),
  ]);
  return {
    vowels: matchRate(true),
    consonants: matchRate(false),
    pacing: totalMs && spokenWords ? Math.round((spokenWords * 60_000) / totalMs) : null,
    top,
    reviewWords: [...reviewWords],
  };
}
