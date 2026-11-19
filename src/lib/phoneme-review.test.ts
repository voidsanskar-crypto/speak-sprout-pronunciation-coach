import { describe, expect, it } from "vitest";
import { scoreTranscript } from "./scoring";
import { dictionarySoundContrast } from "./phoneme-review";

describe("offline sound comparison", () => {
  it("finds the single phoneme contrast between think and sink", () => {
    const comparison = dictionarySoundContrast("Think", "sink");
    expect(comparison?.expected.filter((sound) => sound.different)).toEqual([
      { phone: "TH", sound: "θ", different: true },
    ]);
    expect(comparison?.heard.filter((sound) => sound.different)).toEqual([
      { phone: "S", sound: "s", different: true },
    ]);
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

  it("keeps curly apostrophes in the dictionary lookup without changing word match", () => {
    const [word] = scoreTranscript("I’LL", "eel").words;
    expect(word?.targetSpelling).toBe("i'll");
    const contrast = dictionarySoundContrast(word?.targetSpelling ?? "", word?.heard ?? null);
    expect(contrast?.expected.map(({ sound }) => sound)).toEqual(["aɪ", "l"]);
    expect(dictionarySoundContrast("ill", "eel")?.expected[0]?.sound).toBe("ɪ");
    expect(dictionarySoundContrast("DON’T", "dont")).toBeNull();
    expect(dictionarySoundContrast("They’re", "their")).toBeNull();
    expect(dictionarySoundContrast("IT’S", "its")).toBeNull();
  });

  it("leaves homophones and unknown words to transcript review", () => {
    expect(dictionarySoundContrast("right", "write")).toBeNull();
    expect(dictionarySoundContrast("think", "zxqvks")).toBeNull();
    expect(dictionarySoundContrast("think", null)).toBeNull();
  });
});
