import { createFileRoute, Link } from "@tanstack/react-router";
import { AudioLines, Volume2 } from "lucide-react";
import { useState } from "react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { SpeechPrompt } from "@/components/speakup/SpeechPrompt";
import { WordMatchReview } from "@/components/speakup/WordMatchReview";
import { Button } from "@/components/ui/button";
import { useLocalProfile } from "@/hooks/use-local-profile";
import { usePhonemeAudio } from "@/hooks/use-phoneme-audio";
import { recordTroubleWords } from "@/hooks/use-progress";
import { ACCENT_DRILLS } from "@/lib/accent-drills";
import { PHONEME_IPA, type CoachedSound } from "@/lib/phonemes";
import type { ScoreResult } from "@/lib/scoring";

export const Route = createFileRoute("/accent-x-ray")({
  head: () => ({ meta: [{ title: "Accent X-Ray — Speak Sprout" }] }),
  component: AccentXRay,
});

function AccentXRay() {
  const language = useLocalProfile()?.nativeLanguage;
  return (
    <MobileShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
          <AudioLines aria-hidden="true" className="text-primary" /> Accent X-Ray
        </h1>
        {language ? (
          <MuscleDrill key={language} drills={ACCENT_DRILLS[language]} language={language} />
        ) : (
          <section className="mt-4 rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Set your first language to get a suggested mouth-position drill.
            </p>
            <Button asChild variant="hero" className="mt-3">
              <Link to="/login">Set my first language</Link>
            </Button>
          </section>
        )}
      </div>
    </MobileShell>
  );
}

function MuscleDrill({
  drills,
  language,
}: {
  drills: readonly {
    title: string;
    contrast: string;
    line: string;
    cue: string;
    phone: CoachedSound;
  }[];
  language: string;
}) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const sample = usePhonemeAudio();
  const drill = drills[index]!;
  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="font-display text-xl font-bold">Mother-Tongue Muscle Drill</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Starting points for {language} speakers. Use each drill to check which contrast you want to
        work on.
      </p>
      <div role="group" aria-label="Choose a drill" className="mt-4 flex flex-wrap gap-2">
        {drills.map(({ title }, i) => (
          <Button
            key={title}
            size="sm"
            type="button"
            variant={i === index ? "hero" : "soft"}
            aria-pressed={i === index}
            onClick={() => {
              sample.stop();
              setScore(null);
              setIndex(i);
            }}
          >
            {title}
          </Button>
        ))}
      </div>
      <div className="my-4 rounded-2xl bg-primary-soft p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold">{drill.contrast}</h3>
          <Button variant="soft" size="sm" type="button" onClick={() => sample.play(drill.phone)}>
            <Volume2 aria-hidden="true" /> /{PHONEME_IPA[drill.phone]}/
          </Button>
        </div>
        <p className="mt-1 text-sm">{drill.cue}</p>
        {sample.audioError && (
          <p className="mt-2 text-xs text-danger" role="status">
            The sound sample couldn’t play.
          </p>
        )}
      </div>
      <SpeechPrompt
        key={index}
        text={drill.line}
        onScore={(result) => {
          recordTroubleWords(result.words);
          setScore(result);
        }}
      />
      {score && <WordMatchReview result={score} />}
    </section>
  );
}
