import { describe, expect, it } from "vitest";
import {
  buildMinimalPairRounds,
  DAILY_PAIR_COUNT,
  dailyPairOffset,
  MINIMAL_PAIR_COUNT,
} from "./minimal-pairs";

describe("Minimal Pairs sessions", () => {
  it("covers all 40 pairs without repeating during five consecutive daily sets", () => {
    const seen = new Set<string>();
    for (let day = 20; day <= 24; day++) {
      const offset = dailyPairOffset(new Date(2026, 10, day, 12));
      const rounds = buildMinimalPairRounds(offset, DAILY_PAIR_COUNT);
      expect(rounds).toHaveLength(8);
      for (const round of rounds) {
        const key = [...round.options].sort().join("/");
        expect(seen.has(key)).toBe(false);
        expect(round.tip).toBeTruthy();
        expect(round.options.every((word) => round.ipa[word])).toBe(true);
        seen.add(key);
      }
    }
    expect(seen.size).toBe(40);
  });

  it("moves to fresh pairs on replay and supports a full session", () => {
    const names = (rounds: ReturnType<typeof buildMinimalPairRounds>) =>
      rounds.map(({ options }) => [...options].sort().join("/"));
    const first = names(buildMinimalPairRounds(32, 8));
    const next = names(buildMinimalPairRounds(0, 8));
    expect(next.some((pair) => first.includes(pair))).toBe(false);
    expect(new Set(names(buildMinimalPairRounds(32, 16))).size).toBe(16);
    expect(new Set(names(buildMinimalPairRounds(32, MINIMAL_PAIR_COUNT))).size).toBe(40);
  });
});
