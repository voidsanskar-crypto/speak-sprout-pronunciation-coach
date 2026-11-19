import { describe, expect, it } from "vitest";
import { dictionarySoundContrast } from "./phoneme-review";

describe("offline sound comparison", () => {
  it("finds the single phoneme contrast between think and sink", () => {
    const comparison = dictionarySoundContrast("Think", "sink");
    expect(comparison?.expected.filter((sound) => sound.different)).toEqual([
      { sound: "θ", different: true },
    ]);
    expect(comparison?.heard.filter((sound) => sound.different)).toEqual([
      { sound: "s", different: true },
    ]);
    expect(comparison?.tip).toBe("TH");
  });

  it("handles multicharacter IPA as one sound", () => {
    const comparison = dictionarySoundContrast("sheep", "ship");
    expect(
      comparison?.expected.filter((sound) => sound.different).map(({ sound }) => sound),
    ).toEqual(["iː"]);
    expect(comparison?.heard.filter((sound) => sound.different).map(({ sound }) => sound)).toEqual([
      "ɪ",
    ]);
  });

  it("leaves homophones and unknown words to transcript review", () => {
    expect(dictionarySoundContrast("right", "write")).toBeNull();
    expect(dictionarySoundContrast("think", "zxqvks")).toBeNull();
    expect(dictionarySoundContrast("think", null)).toBeNull();
  });
});
