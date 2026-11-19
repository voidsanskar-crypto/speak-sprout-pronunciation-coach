import type { CoachedSound } from "./phonemes";

interface AccentDrill {
  title: string;
  contrast: string;
  line: string;
  cue: string;
  phone: CoachedSound;
}

export const ACCENT_DRILLS = {
  "Hindi / Urdu": [
    {
      title: "V and W",
      contrast: "vest / west",
      line: "Wear the vest on your way west.",
      cue: "For V, lightly touch your lower lip with your upper teeth. For W, round both lips and keep the teeth away.",
      phone: "V",
    },
    {
      title: "English D",
      contrast: "dental D / alveolar D",
      line: "Do you need a day to decide?",
      cue: "Touch the ridge just behind your upper front teeth for the English D. Release the tongue lightly.",
      phone: "D",
    },
    {
      title: "Start directly with S",
      contrast: "stop / e-stop",
      line: "Stop and skip the last step.",
      cue: "Start with a quiet hiss and move directly into T or K. Keep the cluster together.",
      phone: "S",
    },
  ],
  Spanish: [
    {
      title: "S clusters",
      contrast: "school / e-school",
      line: "Start school and speak slowly.",
      cue: "Start with the hiss, then go straight to the next consonant without a vowel.",
      phone: "S",
    },
    {
      title: "B and V",
      contrast: "berry / very",
      line: "This berry is very sweet.",
      cue: "Close both lips for B. For V, touch upper teeth to lower lip and let the voice continue.",
      phone: "V",
    },
    {
      title: "Y and J",
      contrast: "yes / Jess",
      line: "Yes, Jess is joining us.",
      cue: "Glide straight into the vowel in yes. For Jess, briefly block and release the air behind the ridge.",
      phone: "Y",
    },
  ],
  Japanese: [
    {
      title: "R and L",
      contrast: "right / light",
      line: "Turn right at the light.",
      cue: "Keep the tongue away from the roof for R. Touch behind the upper teeth for L.",
      phone: "R",
    },
    {
      title: "Final consonants",
      contrast: "book / book-uh",
      line: "Put the book in the bag.",
      cue: "Finish on the final consonant. Stop the voice there before starting the next word.",
      phone: "K",
    },
  ],
  Arabic: [
    {
      title: "P and B",
      contrast: "park / bark",
      line: "Park where the dogs bark.",
      cue: "Both use closed lips. Let a small puff escape at P and use your voice for B.",
      phone: "P",
    },
    {
      title: "V and F",
      contrast: "van / fan",
      line: "Put the fan in the van.",
      cue: "Use the same teeth-on-lip position. Add a buzz for V and let only air pass for F.",
      phone: "V",
    },
  ],
  Mandarin: [
    {
      title: "Final N and NG",
      contrast: "sin / sing",
      line: "Sing the last song again.",
      cue: "Use the tongue tip for N. Raise the back of your tongue for NG and let air come through your nose.",
      phone: "NG",
    },
    {
      title: "Voiced TH",
      contrast: "then / zen",
      line: "Then tell them the answer.",
      cue: "Bring the tip of your tongue lightly between your teeth and let it buzz.",
      phone: "DH",
    },
  ],
  Portuguese: [
    {
      title: "Final stop sounds",
      contrast: "cap / cap-uh",
      line: "Keep your cap on top.",
      cue: "Close your lips to finish P. Hold the closure briefly before moving to the next word.",
      phone: "P",
    },
    {
      title: "Long and relaxed I",
      contrast: "sheep / ship",
      line: "The sheep are on the ship.",
      cue: "Use a high, forward tongue for sheep. Lower it slightly and relax for ship.",
      phone: "IH",
    },
  ],
  French: [
    {
      title: "Air at the start of H",
      contrast: "heat / eat",
      line: "Heat it up, then eat.",
      cue: "Let a gentle breath pass before the vowel in heat.",
      phone: "HH",
    },
    {
      title: "English TH",
      contrast: "think / sink",
      line: "Think before you sink.",
      cue: "Put your tongue tip lightly between your teeth and let air escape for think.",
      phone: "TH",
    },
  ],
  Vietnamese: [
    {
      title: "Final T and K",
      contrast: "seat / seek",
      line: "Seek a seat near the door.",
      cue: "Close at the tooth ridge for T and at the soft palate for K. Keep the consonant in place even with a quiet release.",
      phone: "T",
    },
    {
      title: "Final clusters",
      contrast: "desk / des",
      line: "Put the list on the desk.",
      cue: "Let the S flow directly into the last stop, without adding a vowel.",
      phone: "K",
    },
  ],
} as const satisfies Record<string, readonly AccentDrill[]>;

export type NativeLanguage = keyof typeof ACCENT_DRILLS;
export const NATIVE_LANGUAGES = Object.keys(ACCENT_DRILLS) as NativeLanguage[];

export function isNativeLanguage(value: unknown): value is NativeLanguage {
  return typeof value === "string" && Object.hasOwn(ACCENT_DRILLS, value);
}
