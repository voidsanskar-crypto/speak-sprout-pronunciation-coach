import { type SpeechTiming } from "@/hooks/use-speech-recorder";
import { addTrainingWords, recordTroubleWords } from "@/hooks/use-progress";
import { WordMatchReview } from "@/components/speakup/WordMatchReview";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Home, RotateCcw } from "lucide-react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { SpeechPrompt } from "@/components/speakup/SpeechPrompt";
import { Button } from "@/components/ui/button";
import { usePronunciationDictionary } from "@/hooks/use-pronunciation-dictionary";
import { diagnosticReport } from "@/lib/assessment-diagnostics";
import { PHONEME_IPA } from "@/lib/phonemes";
import {
  applyAssessmentPlan,
  ASSESSMENT_PHRASES,
  saveAssessment,
  type AssessmentResult,
} from "@/lib/assessment";
import type { ScoreResult } from "@/lib/scoring";

export const Route = createFileRoute("/assessment")({ component: Assessment });

function Assessment() {
  const [index, setIndex] = useState(0);
  const [takes, setTakes] = useState<{ score: ScoreResult; speakingMs: number | null }[]>([]);
  const [planReady, setPlanReady] = useState(false);
  const [last, setLast] = useState<ScoreResult | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const phrase = ASSESSMENT_PHRASES[index];
  const complete = (score: ScoreResult, timing?: SpeechTiming) => {
    recordTroubleWords(score.words);
    setLast(score);
    setTakes((previous) => [
      ...previous.slice(0, index),
      { score, speakingMs: timing?.speakingMs ?? null },
    ]);
  };
  const advance = () => {
    if (index === ASSESSMENT_PHRASES.length - 1)
      setResult(saveAssessment(takes.map(({ score }) => score.score)));
    else {
      setIndex((value) => value + 1);
      setLast(null);
    }
  };
  const dictionary = usePronunciationDictionary(Boolean(result));
  const report = result ? diagnosticReport(takes, dictionary?.soundEvidence) : null;
  return (
    <MobileShell nav={false}>
      <div className="flex items-center gap-3">
        <Button asChild variant="soft" size="icon-lg" aria-label="Practice Hub">
          <Link to="/skills">
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
      {!result || !report ? (
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
              <WordMatchReview result={last} />
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
          <div className="mt-5 grid grid-cols-3 gap-2 text-left">
            <Pillar
              name="Vowels"
              value={report.vowels === null ? "—" : `${report.vowels}%`}
              note="Dictionary match"
            />
            <Pillar
              name="Consonants"
              value={report.consonants === null ? "—" : `${report.consonants}%`}
              note="Dictionary match"
            />
            <Pillar
              name="Pacing / fluency"
              value={report.pacing === null ? "—" : `${report.pacing} wpm`}
              note={report.pacing === null ? "Timing unavailable" : "Estimated pace"}
            />
          </div>
          <p className="mt-3 text-left text-xs text-muted-foreground">
            Sound results compare dictionary pronunciations using your browser’s transcript. Pacing
            uses the lines with detected speech timing.
          </p>
          <section className="mt-5 rounded-2xl bg-primary-soft p-3.5 text-left">
            <h2 className="font-display text-lg font-semibold">Top trouble sounds</h2>
            {report.top.length ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {report.top.map(({ phone, words }) => (
                  <li key={phone} className="rounded-full bg-card px-3 py-1 text-sm font-bold">
                    /{PHONEME_IPA[phone]}/ · {[...words][0]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                {dictionary === undefined
                  ? "Loading sound comparisons…"
                  : dictionary === null
                    ? "Sound comparisons are unavailable. Your word matches are still available."
                    : "No clear sound substitutions appeared in these transcripts."}
              </p>
            )}
          </section>
          <div className="mt-6 grid gap-3">
            <Button
              variant="hero"
              onClick={() => {
                addTrainingWords(report.reviewWords);
                setResult(
                  applyAssessmentPlan(
                    result,
                    report.top.map(({ phone }) => phone),
                  ),
                );
                setPlanReady(true);
              }}
              disabled={dictionary === undefined || planReady || (!report.reviewWords.length && !report.top.length)}
            >
              Generate my custom training plan
            </Button>
            {planReady && (
              <p role="status" className="text-sm text-primary">
                Plan saved. Review words are due today.
              </p>
            )}
            <Button asChild variant="soft" size="xl">
              <Link to="/practice">
                Start my daily plan
                <ArrowRight />
              </Link>
            </Button>
            <Button
              variant="soft"
              onClick={() => {
                setIndex(0);
                setTakes([]);
                setPlanReady(false);
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

function Pillar({ name, value, note }: { name: string; value: string; note: string }) {
  return (
    <div className="rounded-xl bg-muted p-2 sm:p-3">
      <p className="text-xs font-bold">{name}</p>
      <p className="mt-1 font-display text-lg font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
