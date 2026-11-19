import data from "./data/cmu-english.json";
import { PHONEME_IPA, type CoachedSound } from "./phonemes";
import { compareSymbols } from "./compare-spelling";
import { normalizeWord, pronunciationSpelling, type WordResult } from "./scoring";

const lexicon: Readonly<Record<string, string>> = data;

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
      if (!Object.hasOwn(PHONEME_IPA, letter)) return [];
      const phone = letter as CoachedSound;
      return [{ phone, sound: PHONEME_IPA[phone], different }];
    });
  return { expected: toIpa(best.expected), heard: toIpa(best.recognized) };
}

export type DictionaryContrast = NonNullable<ReturnType<typeof dictionarySoundContrast>>;

// Only compare words whose identity gives a usable dictionary signal.
export function soundEvidence(words: readonly WordResult[]) {
  return words.flatMap((word) => {
    const expected = word.targetSpelling ?? word.target;
    const heard = word.heardSpelling ?? word.heard;
    const contrast = dictionarySoundContrast(expected, heard);
    if (contrast)
      return contrast.expected.map(({ phone, different }) => ({
        phone,
        different,
        word: expected,
      }));
    if (word.status !== "correct") return [];
    return (pronunciations(expected)[0] ?? []).flatMap((phone) =>
      Object.hasOwn(PHONEME_IPA, phone)
        ? [{ phone: phone as CoachedSound, different: false, word: expected }]
        : [],
    );
  });
}

export function textUsesPhones(text: string, phones: ReadonlySet<CoachedSound>) {
  return text
    .split(/[\s–—-]+/)
    .some((word) =>
      (pronunciations(word)[0] ?? []).some((symbol) => phones.has(symbol as CoachedSound)),
    );
}
