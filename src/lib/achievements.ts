import { PHRASES } from "./phrases";
import { masteredIds, soundAverage, type ProgressState } from "./progress";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number; // 0..1
}

export function getAchievements(state: ProgressState): Achievement[] {
  const mastered = new Set(masteredIds(state));
  const th = state.sounds.TH;
  const thAvg = soundAverage(th) ?? 0;
  const thAttempts = th?.attempts ?? 0;
  const rlOk = ["R", "L"].every((s) => {
    const st = state.sounds[s as "R" | "L"];
    return (st?.attempts ?? 0) >= 15 && (soundAverage(st) ?? 0) >= 85;
  });
  const travelIds = PHRASES.filter((p) => p.topic === "travel").map((p) => p.id);
  const travelDone = travelIds.filter((id) => mastered.has(id)).length;
  const perfect = state.attempts.some((a) => a.score === 100);
  const clamp = (x: number) => Math.max(0, Math.min(1, x));

  return [
    {
      id: "first",
      title: "First Words",
      description: "Practice your first phrase",
      unlocked: state.attempts.length > 0,
      progress: clamp(state.attempts.length),
    },
    {
      id: "streak3",
      title: "3-Day Streak",
      description: "Practice 3 days in a row",
      unlocked: state.bestStreak >= 3,
      progress: clamp(state.bestStreak / 3),
    },
    {
      id: "streak7",
      title: "7-Day Streak",
      description: "Practice 7 days in a row",
      unlocked: state.bestStreak >= 7,
      progress: clamp(state.bestStreak / 7),
    },
    {
      id: "goal",
      title: "Goal Getter",
      description: "Hit your daily goal",
      unlocked: state.goalDates.length > 0,
      progress: state.goalDates.length > 0 ? 1 : 0,
    },
    {
      id: "th",
      title: "TH Master",
      description: "Average 85+ on 15 TH words",
      unlocked: thAttempts >= 15 && thAvg >= 85,
      progress: clamp((Math.min(thAttempts, 15) / 15) * (thAvg >= 85 ? 1 : thAvg / 85)),
    },
    {
      id: "rl",
      title: "R & L Pro",
      description: "Average 85+ on R and L",
      unlocked: rlOk,
      progress: rlOk ? 1 : clamp(((state.sounds.R?.attempts ?? 0) + (state.sounds.L?.attempts ?? 0)) / 30) * 0.9,
    },
    {
      id: "perfect",
      title: "Perfect 100",
      description: "Score 100 on a phrase",
      unlocked: perfect,
      progress: perfect ? 1 : 0,
    },
    {
      id: "globetrotter",
      title: "Globetrotter",
      description: "Master every Travel phrase",
      unlocked: travelDone === travelIds.length,
      progress: clamp(travelDone / travelIds.length),
    },
  ];
}
