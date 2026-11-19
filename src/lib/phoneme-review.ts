import data from "./data/cmu-english.json";
import { compareSymbols } from "./compare-spelling";
import { normalizeWord, pronunciationSpelling } from "./scoring";

const lexicon: Readonly<Record<string, string>> = data;

const ipa = {
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
} as const;

export type CoachedSound = keyof typeof ipa;

export const SOUND_COACHING: Record<CoachedSound, string> = {
  AA: "Open your jaw and keep your tongue low and back, as in father.",
  AH: "Relax your lips and keep your tongue low in the middle, as in cup.",
  AO: "Round your lips slightly and keep your tongue low and back, as in caught.",
  AW: "Start with an open jaw, then lift the back of your tongue and round your lips, as in now.",
  AX: "Relax your jaw, lips, and tongue for the unstressed first sound in about.",
  AXR: "Keep your tongue from touching the roof of your mouth for the unstressed ending of butter.",
  AY: "Start with an open jaw, then lift the front of your tongue, as in my.",
  CH: "Briefly block the air behind the tooth ridge, then release it into a quiet hiss.",
  D: "Put your tongue tip behind your upper teeth, then release with your voice on.",
  ER: "Lift or bunch your tongue without touching the roof of your mouth, as in bird.",
  EY: "Start with the front of your tongue raised, then glide a little higher, as in day.",
  F: "Rest your upper teeth on your lower lip and let air pass without using your voice.",
  G: "Press the back of your tongue to the soft palate, then release with your voice on.",
  HH: "Open your mouth slightly and breathe out gently without using your voice.",
  JH: "Briefly block the air behind the tooth ridge, then release it with your voice on.",
  K: "Press the back of your tongue to the soft palate, then release without voicing.",
  M: "Close both lips and let the voiced sound come through your nose.",
  N: "Place your tongue tip behind your upper teeth and let the sound come through your nose.",
  NG: "Raise the back of your tongue to the soft palate and let the sound come through your nose.",
  OW: "Lift the back of your tongue and round your lips as you glide, as in go.",
  OY: "Start with your tongue back and lips rounded, then lift the front of your tongue, as in boy.",
  P: "Close your lips, build up air, then release them without voicing.",
  T: "Put the tip of your tongue behind your upper teeth, then release without voicing.",
  UH: "Round your lips loosely and keep the back of your tongue relaxed, as in book.",
  UW: "Raise the back of your tongue and round your lips, as in food.",
  Y: "Lift the middle of your tongue toward the hard palate and glide directly into the vowel.",
  Z: "Keep your tongue behind your front teeth and use your voice through a narrow gap.",
  ZH: "Lift your tongue toward the roof of your mouth, round your lips slightly, and use your voice.",

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
};

function pronunciations(word: string): string[][] {
  const exact = pronunciationSpelling(word);
  const key = Object.hasOwn(lexicon, exact) ? exact : normalizeWord(word);
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

  const toIpa = (units: typeof best.expected) =>
    units.flatMap(({ letter, different }) => {
      if (!Object.hasOwn(ipa, letter)) return [];
      const phone = letter as CoachedSound;
      return [{ phone, sound: ipa[phone], different }];
    });
  return { expected: toIpa(best.expected), heard: toIpa(best.recognized) };
}

export type DictionaryContrast = NonNullable<ReturnType<typeof dictionarySoundContrast>>;
