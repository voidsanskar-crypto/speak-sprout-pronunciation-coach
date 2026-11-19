import { PHRASES, phrasesForTopic, type Phrase } from "./phrases";
import { DAILY_GOAL, MASTERED_SCORE, type ProgressState } from "./progress";
import { detectSounds, type SoundId } from "./sounds";
import type { TopicId } from "./topics";

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function phrasesWithSound(sound: SoundId): Phrase[] {
  return PHRASES.filter((p) => p.text.split(/\s+/).some((w) => detectSounds(w).includes(sound)));
}

/** Build the list of phrases for a practice session; unmastered phrases come first. */
export function buildQueue(
  opts: { topic?: TopicId | undefined; sound?: SoundId | undefined },
  state: ProgressState,
  rand: () => number = Math.random,
): Phrase[] {
  const isMastered = (p: Phrase) => (state.best[p.id] ?? 0) >= MASTERED_SCORE;
  const prioritise = (list: Phrase[]) => [
    ...shuffle(list.filter((p) => !isMastered(p)), rand),
    ...shuffle(list.filter(isMastered), rand),
  ];
  if (opts.sound) {
    // Put phrases that use the sound most often first.
    const count = (p: Phrase) => p.text.split(/\s+/).filter((w) => detectSounds(w).includes(opts.sound!)).length;
    return shuffle(phrasesWithSound(opts.sound), rand)
      .sort((a, b) => count(b) - count(a))
      .slice(0, 8);
  }
  if (opts.topic) return prioritise(phrasesForTopic(opts.topic));
  return prioritise(PHRASES).slice(0, DAILY_GOAL);
}
