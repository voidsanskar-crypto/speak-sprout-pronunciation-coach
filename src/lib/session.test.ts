import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRESS } from "./progress";
import { buildQueue } from "./session";

describe("practice session filters", () => {
  it("lets a learner choose advanced phrases before completing an assessment", () => {
    const queue = buildQueue({ topic: "travel", level: "Advanced" }, DEFAULT_PROGRESS);
    expect(queue.length).toBeGreaterThan(0);
    expect(
      queue.every((phrase) => phrase.topic === "travel" && phrase.difficulty === "Advanced"),
    ).toBe(true);
  });

  it("applies the selected difficulty to sound drills", () => {
    const queue = buildQueue({ sound: "TH", level: "Intermediate" }, DEFAULT_PROGRESS);
    expect(queue.length).toBeGreaterThan(0);
    expect(queue.every((phrase) => phrase.difficulty === "Intermediate")).toBe(true);
  });
});
