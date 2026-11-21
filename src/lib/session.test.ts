import { describe, expect, it } from "vitest";
import { PHONEME_IPA, type CoachedSound } from "./phonemes";
import { DEFAULT_PROGRESS } from "./progress";
import { buildQueue } from "./session";

describe("practice session filters", () => {
  it("offers three distinct phrases for every Sound Lab key", async () => {
    for (const phone of Object.keys(PHONEME_IPA) as CoachedSound[]) {
      const phrases = await buildQueue({ phone }, DEFAULT_PROGRESS);
      expect(new Set(phrases.slice(0, 3).map(({ text }) => text)).size, phone).toBe(3);
    }
  });

  it("lets a learner choose advanced phrases before completing an assessment", async () => {
    const queue = await buildQueue({ topic: "travel", level: "Advanced" }, DEFAULT_PROGRESS);
    expect(queue.length).toBeGreaterThan(0);
    expect(
      queue.every((phrase) => phrase.topic === "travel" && phrase.difficulty === "Advanced"),
    ).toBe(true);
  });

  it("applies the selected difficulty to sound drills", async () => {
    const queue = await buildQueue({ sound: "TH", level: "Intermediate" }, DEFAULT_PROGRESS);
    expect(queue.length).toBeGreaterThan(0);
    expect(queue.every((phrase) => phrase.difficulty === "Intermediate")).toBe(true);
  });
});
