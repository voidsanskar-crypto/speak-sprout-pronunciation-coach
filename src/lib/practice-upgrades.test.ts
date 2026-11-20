import { describe, expect, it } from "vitest";
import { soundEvidence } from "./phoneme-review";
import { diagnosticReport } from "./assessment-diagnostics";
import { scorePackingClarity } from "./packing-mission";
import { estimatePitch } from "./pitch";
import { addPlanWords } from "./progress";
import { scoreTranscript } from "./scoring";
import { timedMissions } from "./timed-missions";

describe("new practice tools", () => {
  it("uses known dictionary substitutions and only measured timing for an assessment report", () => {
    const report = diagnosticReport(
      [
        { score: scoreTranscript("think", "sink"), speakingMs: 1000 },
        { score: scoreTranscript("sheep", "ship"), speakingMs: null },
        { score: scoreTranscript("right", "light"), speakingMs: null },
        { score: scoreTranscript("book", "zxy"), speakingMs: null },
      ],
      soundEvidence,
    );
    expect(report.top.map(({ phone }) => phone)).toEqual(["TH", "IY", "R"]);
    expect(report.pacing).toBe(60);
    expect(report.vowels).toBeLessThan(100);
    expect(report.consonants).toBeLessThan(100);
    expect(report.reviewWords).toEqual(expect.arrayContaining(["think", "sheep", "right"]));
  });

  it("prioritizes new plan words without resetting existing review steps", () => {
    expect(
      addPlanWords(
        [{ word: "think", due: "2026-11-23", step: 1 }],
        ["think", "right", "right"],
        "2026-11-20",
      ),
    ).toEqual([
      { word: "think", due: "2026-11-20", step: 1 },
      { word: "right", due: "2026-11-20", step: 0 },
    ]);
  });

  it("extracts pitch from voiced samples and ignores silence", () => {
    const sampleRate = 48_000;
    const samples = new Float32Array(2048);
    expect(estimatePitch(samples, sampleRate)).toBeNull();
    for (const hertz of [95, 185, 300]) {
      samples.set(samples.map((_, i) => Math.sin((2 * Math.PI * hertz * i) / sampleRate) / 2));
      expect(estimatePitch(samples, sampleRate)).toBeCloseTo(hertz, 0);
    }
  });

  it("accepts packing aliases and flags a missed word for a chosen item", () => {
    expect(
      scorePackingClarity(
        "Please put the earbuds in the inner pocket",
        "headphones",
        "inside",
        false,
      ).score,
    ).toBe(100);
    expect(
      scorePackingClarity("Move it from the front to the side pocket", "keys", "side", true).score,
    ).toBe(100);
    const misheard = scorePackingClarity(
      "Put the church in the front pocket",
      "charger",
      "front",
      false,
    );
    expect(misheard.score).toBeLessThan(100);
    expect(misheard.words.find(({ target }) => target === "charger")?.similarity).toBeLessThan(0.7);
  });

  it("requires the mission's correct order choices and subway directions", () => {
    const coffee = timedMissions.coffee.turns;
    expect(coffee[0]!.accepts("i’d like a sandwich and a latte")).toBe(true);
    expect(coffee[1]!.accepts("whole milk")).toBe(false);
    expect(coffee[1]!.accepts("oat milk please")).toBe(true);
    expect(coffee[2]!.accepts("to stay")).toBe(false);
    expect(coffee[2]!.accepts("to go, please")).toBe(true);
    const subway = timedMissions.subway.turns;
    expect(subway[0]!.accepts("where is the terminal for the blue line?")).toBe(true);
    expect(subway[1]!.accepts("i’m heading to riverside")).toBe(true);
    expect(subway[2]!.accepts("should i use gate b?")).toBe(true);
  });
});
