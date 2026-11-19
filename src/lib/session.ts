import { PHRASES, phrasesForTopic, type Phrase } from "./phrases";
import { DAILY_GOAL, MASTERED_SCORE, type ProgressState } from "./progress";
import { detectSounds, type SoundId } from "./sounds";
import type { TopicId } from "./topics";
import { loadAssessment } from "./assessment";
import type { Difficulty } from "./topics";
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
  opts: { topic?: TopicId | undefined; sound?: SoundId | undefined },
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
  const recentAverage = recentScores.length ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : null;
  const levels: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
  const assessed = loadAssessment()?.level ?? "Beginner";
  let levelIndex = levels.indexOf(assessed);
  // Performance steadily unlocks harder material, and persistent difficulty brings in review.
  if (recentAverage !== null && recentScores.length >= 5) {
    if (recentAverage >= 86) levelIndex = Math.min(2, levelIndex + 1);
    else if (recentAverage < 52) levelIndex = Math.max(0, levelIndex - 1);
  }
  if (opts.sound) {
    // Put phrases that use the sound most often first.
    const count = (p: Phrase) =>
      p.text.split(/\s+/).filter((w) => detectSounds(w).includes(opts.sound!)).length;
    return shuffle(phrasesWithSound(opts.sound), rand)
      .sort((a, b) => count(b) - count(a))
      .slice(0, 8);
  }
  const eligible = (list: Phrase[]) => list.filter((p) => levels.indexOf(p.difficulty) <= levelIndex && levels.indexOf(p.difficulty) >= Math.max(0, levelIndex - 1));
  if (opts.topic) return prioritise(eligible(phrasesForTopic(opts.topic)));
  const topicOrder = topicsForGoals(loadLearningGoals());
  const daily = prioritise(eligible(PHRASES)).sort((a,b)=>{
    const aRank=topicOrder.indexOf(a.topic), bRank=topicOrder.indexOf(b.topic);
    return (aRank<0?99:aRank)-(bRank<0?99:bRank);
  });
  const weakSounds = loadAssessment()?.weakSounds ?? [];
  if (!weakSounds.length) return daily.slice(0, DAILY_GOAL);
  const targeted = daily.filter((phrase) =>
    phrase.text
      .split(/\s+/)
      .some((word) => detectSounds(word).some((sound) => weakSounds.includes(sound))),
  );
  const others = daily.filter((phrase) => !targeted.includes(phrase));
  return [...targeted, ...others].slice(0, DAILY_GOAL);
}
