import { describe, expect, it } from "vitest";
import { scoreBest, scoreTranscript } from "./scoring";
import { shouldCelebrate } from "./celebrate";

describe("pronunciation scoring", () => {
  it("gives 100 and all green for an exact match, ignoring case and punctuation", () => {
    const r = scoreTranscript("Where is the train station?", "where is the train station");
    expect(r.score).toBe(100);
    expect(r.words.every((w) => w.status === "correct")).toBe(true);
  });

  it("marks a word that was not said as missed (red)", () => {
    const r = scoreTranscript("Nice to meet you.", "nice to you");
    expect(r.words[2]?.status).toBe("missed");
    expect(r.score).toBeLessThan(90);
  });

  it("marks a near-miss word as close (yellow)", () => {
    const r = scoreTranscript("I think so", "I sink so");
    expect(r.words[1]?.status).toBe("close");
  });

  it("scores 0 when nothing was heard", () => {
    expect(scoreTranscript("Nice to meet you.", "").score).toBe(0);
  });

  it("treats spoken digits like the written number word", () => {
    expect(scoreTranscript("for two nights", "for 2 nights").score).toBe(100);
  });

  it("picks the best recognition alternative", () => {
    expect(scoreBest("Thank you", ["tank you", "thank you"]).score).toBe(100);
  });

  it("plays confetti only for scores above 90", () => {
    expect(shouldCelebrate(91)).toBe(true);
    expect(shouldCelebrate(90)).toBe(false);
  });
});
