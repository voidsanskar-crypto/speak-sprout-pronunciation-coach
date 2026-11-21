import { PHONEME_IPA, type CoachedSound } from "@/lib/phonemes";

// Schematic side view, with the lips on the left and throat on the right.
const guides = {
  V: [36, 48, "Upper teeth touch the lower lip"],
  P: [37, 53, "Both lips meet"],
  TH: [18, 37, "Tongue tip between the teeth"],
  DH: [18, 37, "Tongue tip between the teeth"],
  T: [41, 24, "Tongue tip touches the ridge"],
  D: [41, 24, "Tongue tip touches the ridge"],
  S: [39, 34, "Narrow gap behind the teeth"],
  R: [54, 34, "Tongue draws back"],
  Y: [44, 42, "Middle of the tongue rises"],
  K: [36, 53, "Back of the tongue meets the palate"],
  NG: [36, 53, "Back of the tongue meets the palate"],
  IH: [39, 45, "Front of the tongue lifts slightly"],
  HH: [42, 54, "Open passage for a gentle breath"],
} as const;
export function MouthPosition({ phone }: { phone: CoachedSound }) {
  if (!(phone in guides)) return null;
  const [x, y, caption] = guides[phone as keyof typeof guides];
  const back = phone === "K" || phone === "NG";
  const lipY = phone === "P" ? 34 : phone === "V" ? 38 : 48;
  return (
    <figure className="my-3 flex items-center gap-3 rounded-xl bg-card p-3">
      <svg aria-hidden="true" viewBox="0 0 108 75" className="w-24 shrink-0">
        <path
          d="M14 31 Q23 29 30 24 Q65 4 92 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M25 27 L33 24 L31 38 L25 38 Z"
          fill="white"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d={`M16 ${lipY} Q29 66 65 65 L92 57`}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d={`M91 60 Q82 ${back ? -9 : phone === "Y" ? 9 : 47} 65 ${back ? 18 : phone === "Y" ? 24 : 51} Q53 55 ${x} ${y} Q${x - 5} ${y + 4} ${x + 4} ${y + 8} Q61 69 91 64Z`}
          fill="#da8375"
        />
        <path
          d={`M13 32 L21 32 M13 ${lipY} L23 ${lipY}`}
          stroke="#984b43"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      <figcaption className="text-sm">
        <strong>/{PHONEME_IPA[phone]}/</strong>
        <br />
        {caption}
      </figcaption>
    </figure>
  );
}
