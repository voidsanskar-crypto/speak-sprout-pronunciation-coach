import type { CoachedSound } from "./phonemes";
import { textUsesPhones } from "./phoneme-review";
import { PHRASES, phrasesForTopic, type Phrase } from "./phrases";
import { DAILY_GOAL, MASTERED_SCORE, type ProgressState } from "./progress";
import { detectSounds, type SoundId } from "./sounds";
import { DIFFICULTIES, type Difficulty, type TopicId } from "./topics";
import { loadAssessment } from "./assessment";
import { loadLearningGoals, topicsForGoals } from "./learning-plan";

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
  opts: {
    topic?: TopicId | undefined;
    sound?: SoundId | undefined;
    phone?: CoachedSound | undefined;
    level?: Difficulty | undefined;
  },
  state: ProgressState,
  rand: () => number = Math.random,
): Phrase[] {
  const isMastered = (p: Phrase) => (state.best[p.id] ?? 0) >= MASTERED_SCORE;
  const prioritise = (list: Phrase[]) => [
    ...shuffle(
      list.filter((p) => !isMastered(p)),
      rand,
    ),
    ...shuffle(list.filter(isMastered), rand),
  ];
  const recentScores = state.attempts.slice(-12).map((a) => a.score);
  const recentAverage = recentScores.length
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    : null;
  const levels = DIFFICULTIES;
  const assessment = loadAssessment();
  const assessed = assessment?.level ?? "Beginner";
  let levelIndex = levels.indexOf(assessed);
  // Performance steadily unlocks harder material, and persistent difficulty brings in review.
  if (recentAverage !== null && recentScores.length >= 5) {
    if (recentAverage >= 86) levelIndex = Math.min(2, levelIndex + 1);
    else if (recentAverage < 52) levelIndex = Math.max(0, levelIndex - 1);
  }
  if (opts.phone) {
    const focus = new Set([opts.phone]);
    return prioritise(
      PHRASES.filter(
        (phrase) =>
          (!opts.level || phrase.difficulty === opts.level) &&
          (!opts.topic || phrase.topic === opts.topic) &&
          textUsesPhones(phrase.text, focus),
      ),
    ).slice(0, 8);
  }
  if (opts.sound) {
    // Put phrases that use the sound most often first.
    const count = (p: Phrase) =>
      p.text.split(/\s+/).filter((w) => detectSounds(w).includes(opts.sound!)).length;
    const phrases = phrasesWithSound(opts.sound).filter(
      (phrase) =>
        (!opts.level || phrase.difficulty === opts.level) &&
        (!opts.topic || phrase.topic === opts.topic),
    );
    return shuffle(phrases, rand)
      .sort((a, b) => count(b) - count(a))
      .slice(0, 8);
  }
  const eligible = (list: Phrase[]) =>
    list.filter((phrase) => {
      if (opts.level) return phrase.difficulty === opts.level;
      const index = levels.indexOf(phrase.difficulty);
      return index <= levelIndex && index >= Math.max(0, levelIndex - 1);
    });
  if (opts.topic) return prioritise(eligible(phrasesForTopic(opts.topic)));
  const topicOrder = topicsForGoals(loadLearningGoals());
  const daily = prioritise(eligible(PHRASES)).sort((a, b) => {
    const aRank = topicOrder.indexOf(a.topic),
      bRank = topicOrder.indexOf(b.topic);
    return (aRank < 0 ? 99 : aRank) - (bRank < 0 ? 99 : bRank);
  });
  const focusPhones = new Set(assessment?.focusPhones);
  const weakSounds = assessment?.weakSounds ?? [];
  if (!weakSounds.length && !focusPhones.size) return daily.slice(0, DAILY_GOAL);
  const targeted = daily.filter((phrase) =>
    focusPhones.size
      ? textUsesPhones(phrase.text, focusPhones)
      : phrase.text
          .split(/\s+/)
          .some((word) => detectSounds(word).some((sound) => weakSounds.includes(sound))),
  );
  const others = daily.filter((phrase) => !targeted.includes(phrase));
  return [...targeted, ...others].slice(0, DAILY_GOAL);
}
