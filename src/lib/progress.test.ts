import { describe, expect, it } from "vitest";
import { earnXp, applyAttempt, currentStreak, DAILY_GOAL, DEFAULT_PROGRESS, masteredIds, phrasesDoneOn } from "./progress";
import { PHRASES, ipaWords, displayWords } from "./phrases";

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
const attempt = (phraseId: string, score = 80) => ({ phraseId, score, words: [] });

describe("progress rules", () => {
  it("shares XP and streak credit across practice and listening", () => {
    const practice = applyAttempt(DEFAULT_PROGRESS, attempt("travel-1"), at(2026, 3, 1));
    const sprint = { ...practice, ...earnXp(practice, 20, practice.lastActiveDate!) };
    expect(sprint.streak).toBe(1);
    expect(sprint.dailyXp?.points).toBe(practice.xp + 20);
    const tomorrow = earnXp(sprint, 10, "2026-03-02");
    expect(tomorrow.streak).toBe(2);
    expect(tomorrow.dailyXp?.points).toBe(10);
  });

  it("has at least 40 seed phrases with one IPA token per word", () => {
    expect(PHRASES.length).toBeGreaterThanOrEqual(40);
    for (const p of PHRASES) expect(ipaWords(p).length, p.text).toBe(displayWords(p.text).length);
  });

  it("daily goal is 10 phrases", () => {
    expect(DAILY_GOAL).toBe(10);
  });

  it("grows the streak on consecutive days and resets after a missed day", () => {
    let s = applyAttempt(DEFAULT_PROGRESS, attempt("travel-1"), at(2026, 3, 1));
    s = applyAttempt(s, attempt("travel-2"), at(2026, 3, 2));
    expect(s.streak).toBe(2);
    expect(currentStreak(s, "2026-03-03")).toBe(2);
    expect(currentStreak(s, "2026-03-04")).toBe(0);
    s = applyAttempt(s, attempt("travel-3"), at(2026, 3, 5));
    expect(s.streak).toBe(1);
  });

  it("counts distinct phrases toward today's goal", () => {
    let s = applyAttempt(DEFAULT_PROGRESS, attempt("travel-1"), at(2026, 3, 1));
    s = applyAttempt(s, attempt("travel-1"), at(2026, 3, 1));
    expect(phrasesDoneOn(s, "2026-03-01")).toBe(1);
  });

  it("marks a phrase mastered at a best score of 85 or more", () => {
    let s = applyAttempt(DEFAULT_PROGRESS, attempt("travel-1", 84), at(2026, 3, 1));
    expect(masteredIds(s)).toEqual([]);
    s = applyAttempt(s, attempt("travel-1", 85), at(2026, 3, 1));
    expect(masteredIds(s)).toEqual(["travel-1"]);
  });
});
