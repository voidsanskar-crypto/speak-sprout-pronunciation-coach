export type SoundId = "TH" | "R" | "L" | "V" | "W" | "SH";

export interface SoundInfo {
  id: SoundId;
  label: string;
  ipa: string;
  example: string;
  tip: string;
}

export const SOUNDS: Record<SoundId, SoundInfo> = {
  TH: {
    id: "TH",
    label: "TH",
    ipa: "/θ/ /ð/",
    example: "think, this",
    tip: "Put the tip of your tongue lightly between your front teeth and blow air out gently. Add your voice for words like “this” (ð); use only air for “think” (θ). Don't let it turn into a T, D, S or Z.",
  },
  R: {
    id: "R",
    label: "R",
    ipa: "/ɹ/",
    example: "red, road",
    tip: "Pull your tongue back and curl the tip up slightly — it should NOT touch the roof of your mouth. Round your lips a little, like starting to say “oo”.",
  },
  L: {
    id: "L",
    label: "L",
    ipa: "/l/",
    example: "light, lemon",
    tip: "Press the tip of your tongue firmly on the bumpy ridge just behind your top teeth and let the air flow out around the sides of your tongue.",
  },
  V: {
    id: "V",
    label: "V",
    ipa: "/v/",
    example: "very, village",
    tip: "Rest your top teeth gently on your bottom lip and push air through while humming — you should feel a buzz on your lip. Lips should not round.",
  },
  W: {
    id: "W",
    label: "W",
    ipa: "/w/",
    example: "we, wait",
    tip: "Round your lips into a small tight circle, like a kiss, then open them quickly into the vowel. Your teeth never touch your lip.",
  },
  SH: {
    id: "SH",
    label: "SH",
    ipa: "/ʃ/",
    example: "shop, station",
    tip: "Push your lips forward a little, lift your tongue close to the roof of your mouth without touching, and let out a soft “hush” of air.",
  },
};

export const SOUND_IDS = Object.keys(SOUNDS) as SoundId[];

export const GENERIC_TIP =
  "Say it slowly, one syllable at a time, and stress the syllable marked with ˈ in the IPA. Then speed up while keeping each sound clear.";

/** Detect which tracked problem sounds appear in an English word (by spelling). */
export function detectSounds(word: string): SoundId[] {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  const found: SoundId[] = [];
  if (w.includes("th")) found.push("TH");
  if (/sh|tion|sion|ssion/.test(w)) found.push("SH");
  if (w.includes("r")) found.push("R");
  if (w.includes("l")) found.push("L");
  if (w.includes("v")) found.push("V");
  if (/wh|w(?=[aeiouy])/.test(w)) found.push("W");
  return found;
}
