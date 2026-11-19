import data from "./data/cmu-english.json";
import { compareSymbols } from "./compare-spelling";
import { normalizeWord } from "./scoring";

const lexicon: Readonly<Record<string, string>> = data;

const ipa: Readonly<Record<string, string>> = {
  AA: "ɑ",
  AE: "æ",
  AH: "ʌ",
  AO: "ɔ",
  AW: "aʊ",
  AX: "ə",
  AXR: "ɚ",
  AY: "aɪ",
  B: "b",
  CH: "tʃ",
  D: "d",
  DH: "ð",
  EH: "ɛ",
  ER: "ɝ",
  EY: "eɪ",
  F: "f",
  G: "ɡ",
  HH: "h",
  IH: "ɪ",
  IY: "iː",
  JH: "dʒ",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  NG: "ŋ",
  OW: "oʊ",
  OY: "ɔɪ",
  P: "p",
  R: "ɹ",
  S: "s",
  SH: "ʃ",
  T: "t",
  TH: "θ",
  UH: "ʊ",
  UW: "uː",
  V: "v",
  W: "w",
  Y: "j",
  Z: "z",
  ZH: "ʒ",
};

export const SOUND_COACHING = {
  TH: "For /θ/, place the tip of your tongue lightly between your teeth and let air flow without voicing.",
  DH: "For /ð/, place the tip of your tongue lightly between your teeth and use your voice.",
  S: "For /s/, keep the tip of your tongue behind your front teeth and send air through a narrow gap.",
  R: "For /ɹ/, keep your tongue from touching the roof of your mouth.",
  L: "For /l/, touch the ridge just behind your upper front teeth with the tip of your tongue.",
  V: "For /v/, rest your upper teeth on your lower lip and use your voice as air passes through.",
  B: "For /b/, close both lips, then release them while using your voice.",
  W: "For /w/, round both lips and move directly into the following vowel.",
  IY: "For /iː/, keep your tongue high and forward, as in sheep.",
  IH: "For /ɪ/, let your tongue sit a little lower and more relaxed than for /iː/.",
  AE: "For /æ/, open your jaw wider than for /ɛ/ and keep the vowel toward the front of your mouth.",
  EH: "For /ɛ/, relax your jaw slightly open with your tongue forward, as in bet.",
  SH: "For /ʃ/, lift your tongue toward the roof of your mouth and round your lips slightly.",
} as const;

export type CoachedSound = keyof typeof SOUND_COACHING;

function pronunciations(word: string): string[][] {
  const key = normalizeWord(word);
  if (!Object.hasOwn(lexicon, key)) return [];
  return lexicon[key]!.split("|").map((variant) => variant.split(" "));
}

function signature(alignment: ReturnType<typeof compareSymbols>) {
  return [alignment.expected, alignment.recognized]
    .map((side) =>
      side
        .filter((unit) => unit.different)
        .map((unit) => unit.letter)
        .join(" "),
    )
    .join("|");
}

export function dictionarySoundContrast(expectedWord: string, recognizedWord: string | null) {
  if (!recognizedWord) return null;
  const alternatives = pronunciations(expectedWord).flatMap((expected) =>
    pronunciations(recognizedWord).map((heard) => compareSymbols(expected, heard)),
  );
  if (!alternatives.length) return null;

  const distance = Math.min(...alternatives.map((alignment) => alignment.distance));
  const closest = alternatives.filter((alignment) => alignment.distance === distance);
  const best = closest[0]!;
  // Homophones and multiple equally plausible contrasts give no reliable coaching signal.
  if (!distance || closest.some((alignment) => signature(alignment) !== signature(best)))
    return null;

  const changedTarget = best.expected.filter((unit) => unit.different);
  const changedHeard = best.recognized.filter((unit) => unit.different);
  const targetSound = changedTarget[0]?.letter ?? "";
  const tip =
    distance === 1 &&
    changedTarget.length === 1 &&
    changedHeard.length === 1 &&
    Object.hasOwn(SOUND_COACHING, targetSound)
      ? (targetSound as CoachedSound)
      : null;
  const toIpa = (units: typeof best.expected) =>
    units.map(({ letter, different }) => ({ sound: ipa[letter] ?? letter, different }));
  return { expected: toIpa(best.expected), heard: toIpa(best.recognized), tip };
}

export type DictionaryContrast = NonNullable<ReturnType<typeof dictionarySoundContrast>>;
