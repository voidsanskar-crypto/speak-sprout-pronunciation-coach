import { describe, expect, it } from "vitest";
import { applyAttempt, DEFAULT_PROGRESS, queueTroubleWords, reviewWord } from "./progress";

describe("personal review schedule", () => {
  const words = [
    { target: "think", similarity: 0.69 },
    { target: "think", similarity: 0.45 },
    { target: "train", similarity: 0.7 },
  ];

  it("queues distinct words strictly under 70% from regular practice", () => {
    const progress = applyAttempt(
      DEFAULT_PROGRESS,
      {
        phraseId: "sample",
        score: 82,
        words,
      },
      new Date(2026, 10, 19, 12),
    );
    expect(progress.reviewDeck).toEqual([{ word: "think", due: "2026-11-20", step: 0 }]);
  });

  it("waits until a review is due, advances at three and seven days, then removes the card", () => {
    let deck = queueTroubleWords([], words, "2026-11-19");
    expect(reviewWord(deck, "think", true, "2026-11-19")).toBe(deck);
    deck = reviewWord(deck, "think", true, "2026-11-20");
    expect(deck).toEqual([{ word: "think", due: "2026-11-23", step: 1 }]);
    deck = reviewWord(deck, "think", true, "2026-11-23");
    expect(deck).toEqual([{ word: "think", due: "2026-11-30", step: 2 }]);
    expect(reviewWord(deck, "think", true, "2026-11-30")).toEqual([]);
  });

  it("restarts after a low result without postponing an overdue card", () => {
    const first = queueTroubleWords([], words, "2026-11-19");
    const second = reviewWord(first, "think", true, "2026-11-20");
    expect(reviewWord(second, "think", false, "2026-11-23")).toEqual([
      { word: "think", due: "2026-11-24", step: 0 },
    ]);
    expect(queueTroubleWords(second, words, "2026-11-24")).toEqual([
      { word: "think", due: "2026-11-23", step: 0 },
    ]);
  });
});
