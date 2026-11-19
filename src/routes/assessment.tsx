import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Home, RotateCcw } from "lucide-react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { SpeechPrompt } from "@/components/speakup/SpeechPrompt";
import { Button } from "@/components/ui/button";
import { ASSESSMENT_PHRASES, saveAssessment, type AssessmentResult } from "@/lib/assessment";
import type { ScoreResult } from "@/lib/scoring";

export const Route = createFileRoute("/assessment")({ component: Assessment });

function Assessment() {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [last, setLast] = useState<ScoreResult | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const phrase = ASSESSMENT_PHRASES[index];
  const complete = (score: ScoreResult) => {
    setLast(score);
    setScores((previous) => [...previous.slice(0, index), score.score]);
  };
  const advance = () => {
    if (index === ASSESSMENT_PHRASES.length - 1) setResult(saveAssessment(scores));
    else {
      setIndex((value) => value + 1);
      setLast(null);
    }
  };
  return (
    <MobileShell nav={false}>
      <div className="flex items-center gap-3">
        <Button asChild variant="soft" size="icon-lg" aria-label="Home">
          <Link to="/">
            <Home />
          </Link>
        </Button>
        <div className="flex-1">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Speaking check
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-hero transition-all"
              style={{ width: `${result ? 100 : ((index + (last ? 1 : 0)) / 5) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-bold text-muted-foreground">{result ? 5 : index + 1}/5</span>
      </div>
      {!result ? (
        <>
          <h1 className="mt-7 font-display text-3xl font-bold">Find your starting level</h1>
          <p className="mb-5 mt-2 text-sm text-muted-foreground">
            Say five lines aloud. We’ll use the browser’s word matches to choose a starting level
            and suggest drills.
          </p>
          {phrase && (
            <SpeechPrompt key={index} text={phrase.text} ipa={phrase.ipa} onScore={complete} />
          )}
          {last && (
            <div className="mt-4 rounded-2xl bg-primary-soft p-4">
              <p className="font-bold">Word match: {last.score}%</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We heard: “{last.transcript || "No clear speech"}”
              </p>
              <Button className="mt-3 w-full" variant="hero" onClick={advance}>
                {index === 4 ? "See my level" : "Next phrase"}
                <ArrowRight />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-10 rounded-[2rem] bg-card p-7 text-center shadow-card">
          <p className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
            Your starting practice level
          </p>
          <p className="mt-3 font-display text-4xl font-bold">{result.level}</p>
          <p className="mt-2 text-2xl font-bold text-primary">{result.score}% word match</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {result.weakSounds.length
              ? `Your daily practice will focus more on ${result.weakSounds.join(", ")} sounds.`
              : "Your daily plan includes a mix of sound drills."}
          </p>
          <div className="mt-6 grid gap-3">
            <Button asChild variant="hero" size="xl">
              <Link to="/practice">
                Start my daily plan
                <ArrowRight />
              </Link>
            </Button>
            <Button
              variant="soft"
              onClick={() => {
                setIndex(0);
                setScores([]);
                setLast(null);
                setResult(null);
              }}
            >
              <RotateCcw /> Retake assessment
            </Button>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
