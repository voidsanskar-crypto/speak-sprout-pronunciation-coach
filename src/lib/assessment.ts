import { TRACKED_PHONE_DRILLS, type CoachedSound } from "./phonemes";
import type { SoundId } from "./sounds";

export const ASSESSMENT_KEY = "speakup:assessment:v1";
export interface AssessmentResult {
  score: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  weakSounds: SoundId[];
  focusPhones?: CoachedSound[];
  completedAt: number;
}

export const ASSESSMENT_PHRASES = [
  {
    text: "Please leave the green key near the window.",
    ipa: "pliz liv ðə ɡrin ki nɪr ðə ˈwɪndoʊ",
    sound: "L" as SoundId,
  },
  {
    text: "Three thoughtful friends threw fresh flowers.",
    ipa: "θri ˈθɔtfəl frɛndz θru frɛʃ ˈflaʊərz",
    sound: "TH" as SoundId,
  },
  {
    text: "Victor will visit the village this winter.",
    ipa: "ˈvɪktər wɪl ˈvɪzɪt ðə ˈvɪlɪdʒ ðɪs ˈwɪntər",
    sound: "V" as SoundId,
  },
  {
    text: "Red lorries roll along the road.",
    ipa: "rɛd ˈlɔriz roʊl əˈlɔŋ ðə roʊd",
    sound: "R" as SoundId,
  },
  {
    text: "She chose a shiny blue jacket.",
    ipa: "ʃi tʃoʊz ə ˈʃaɪni blu ˈdʒækət",
    sound: "SH" as SoundId,
  },
] as const;

export function loadAssessment(): AssessmentResult | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(
      window.localStorage.getItem(ASSESSMENT_KEY) ?? "null",
    ) as AssessmentResult | null;
  } catch {
    return null;
  }
}

export function saveAssessment(scores: number[]): AssessmentResult {
  const score = Math.round(
    scores.reduce((sum, value) => sum + value, 0) / Math.max(scores.length, 1),
  );
  const level = score < 55 ? "Beginner" : score < 82 ? "Intermediate" : "Advanced";
  const weakSounds = ASSESSMENT_PHRASES.filter((_, i) => (scores[i] ?? 0) < 75).map(
    (phrase) => phrase.sound,
  );
  const result: AssessmentResult = {
    score,
    level,
    weakSounds: [...new Set(weakSounds)],
    completedAt: Date.now(),
  };
  persistAssessment(result);
  return result;
}

export function applyAssessmentPlan(
  result: AssessmentResult,
  phones: CoachedSound[],
): AssessmentResult {
  const weakSounds = phones.flatMap((phone) => {
    const drill = TRACKED_PHONE_DRILLS[phone];
    return drill ? [drill] : [];
  });
  const next = { ...result, focusPhones: phones, weakSounds: [...new Set(weakSounds)] };
  persistAssessment(next);
  return next;
}

function persistAssessment(result: AssessmentResult) {
  try {
    window.localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(result));
  } catch {
    /* keep the result for this session */
  }
}

export function approximateIpa(text: string): string {
  return text
    .toLowerCase()
    .replace(/tion\b/g, "ʃən")
    .replace(/sion\b/g, "ʒən")
    .replace(/tch/g, "tʃ")
    .replace(/sh/g, "ʃ")
    .replace(/ch/g, "tʃ")
    .replace(/th/g, "θ")
    .replace(/ph/g, "f")
    .replace(/ng\b/g, "ŋ")
    .replace(/ee|ea/g, "iː")
    .replace(/oo/g, "uː")
    .replace(/ai|ay/g, "eɪ")
    .replace(/oi|oy/g, "ɔɪ")
    .replace(/ow/g, "aʊ")
    .replace(/a/g, "æ")
    .replace(/e/g, "ɛ")
    .replace(/i/g, "ɪ")
    .replace(/o/g, "ɑ")
    .replace(/u/g, "ʌ")
    .replace(/c(?=[eiy])/g, "s")
    .replace(/c/g, "k")
    .replace(/j/g, "dʒ")
    .replace(/y/g, "j")
    .replace(/[^a-zæɛɪɑʌːʃʒθŋtʃɔɪaʊeɪ\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
