import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { SpeechPrompt } from "@/components/speakup/SpeechPrompt";
import { WordMatchReview } from "@/components/speakup/WordMatchReview";
import { Button } from "@/components/ui/button";
import { getProgressSnapshot, recordAttempt, reviewDeckWord } from "@/hooks/use-progress";
import type { Phrase } from "@/lib/phrases";
import { toDateKey } from "@/lib/progress";
import { type ScoreResult } from "@/lib/scoring";
import { buildQueue } from "@/lib/session";
import { canSpeak, speak, stopSpeaking } from "@/lib/speech";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/daily-session")({
  head: () => ({ meta: [{ title: "Today’s session — Speak Sprout" }] }),
  component: DailySession,
});

type Step =
  { kind: "review"; word: string } | { kind: "phrase"; phrase: Phrase } | { kind: "pair" };
const contrasts = [
  ["ship", "sheep"],
  ["think", "sink"],
  ["right", "light"],
  ["berry", "very"],
] as const;

function DailySession() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [index, setIndex] = useState(0);
  const [scored, setScored] = useState<ScoreResult | null>(null);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    const progress = getProgressSnapshot();
    const date = toDateKey(new Date());
    const reviews = progress.reviewDeck
      .filter(({ due }) => due <= date)
      .sort((a, b) => a.due.localeCompare(b.due))
      .slice(0, 2);
    setSteps([
      ...reviews.map(({ word }): Step => ({ kind: "review", word })),
      ...buildQueue({}, progress)
        .slice(0, 3)
        .map((phrase): Step => ({ kind: "phrase", phrase })),
      { kind: "pair" },
    ]);
    return stopSpeaking;
  }, []);

  const step = steps[index];
  function advance(worked: boolean) {
    stopSpeaking();
    if (worked) {
      setCompleted((n) => n + 1);
      if (step?.kind === "review" && scored) {
        reviewDeckWord(step.word, scored.words[0]?.status === "correct");
      }
      if (step?.kind === "phrase" && scored) {
        recordAttempt({ phraseId: step.phrase.id, score: scored.score, words: scored.words });
      }
    }
    setScored(null);
    setIndex((n) => n + 1);
  }

  return (
    <MobileShell nav={false}>
      <Link to="/" className="text-sm font-bold text-primary">
        Back to Today
      </Link>
      <h1 className="mt-3 font-display text-3xl font-bold">Today’s 5-minute session</h1>
      {step ? (
        <>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            Step {index + 1} of {steps.length}
          </p>
          <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <h2 className="mb-3 font-display text-2xl font-bold">
              {step.kind === "review"
                ? "Review a due word"
                : step.kind === "phrase"
                  ? "Practice a target phrase"
                  : "One quick listening round"}
            </h2>
            {step.kind === "pair" ? (
              <QuickPair onFinish={advance} />
            ) : (
              <>
                <SpeechPrompt
                  key={index}
                  text={step.kind === "phrase" ? step.phrase.text : step.word}
                  {...(step.kind === "phrase" ? { ipa: step.phrase.ipa } : {})}
                  onScore={setScored}
                />
                {scored && (
                  <div className="mt-3">
                    <p className="font-bold">{scored.score}% word match</p>
                    <WordMatchReview result={scored} />
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {scored && (
                    <Button variant="hero" onClick={() => advance(true)}>
                      Continue <ArrowRight aria-hidden="true" />
                    </Button>
                  )}
                  <Button variant="soft" onClick={() => advance(false)}>
                    Skip
                  </Button>
                </div>
              </>
            )}
          </section>
        </>
      ) : steps.length ? (
        <section className="mt-4 rounded-2xl border border-border bg-card p-5">
          <Check aria-hidden="true" className="size-8 text-primary" />
          <h2 className="mt-2 font-display text-xl font-bold">Session complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {completed} of {steps.length} activities practiced.
          </p>
          <Button asChild variant="hero" className="mt-4">
            <Link to="/">Back to Today</Link>
          </Button>
        </section>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Preparing your session…</p>
      )}
    </MobileShell>
  );
}

function QuickPair({ onFinish }: { onFinish: (worked: boolean) => void }) {
  const [choices, setChoices] = useState<{
    words: readonly [string, string];
    target: string;
  } | null>(null);
  const [ready, setReady] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState(false);

  function play() {
    if (!canSpeak()) {
      setError(true);
      return;
    }
    const pair = contrasts[Math.floor(Math.random() * contrasts.length)]!;
    const next = choices ?? {
      words: Math.random() < 0.5 ? pair : ([pair[1], pair[0]] as const),
      target: pair[Math.random() < 0.5 ? 0 : 1],
    };
    setChoices(next);
    setError(false);
    setReady(true);
    speak(next.target, {
      onError: () => {
        setError(true);
        setReady(false);
      },
    });
  }

  return (
    <>
      <Button variant="soft" onClick={play}>
        <Volume2 aria-hidden="true" /> {choices ? "Replay mystery word" : "Play mystery word"}
      </Button>
      {error && (
        <p role="status" className="mt-2 text-sm text-danger">
          Audio is unavailable. You can skip this round.
        </p>
      )}
      {choices && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {choices.words.map((word) => (
            <button
              key={word}
              type="button"
              disabled={!ready || Boolean(answer)}
              onClick={() => setAnswer(word)}
              className={cn(
                "rounded-xl border border-border bg-primary-soft px-1 py-4 font-display text-xl font-bold",
                answer && word === choices.target && "border-success bg-success-soft text-success",
              )}
            >
              {word}
            </button>
          ))}
        </div>
      )}
      {answer && (
        <p role="status" className="mt-3 text-sm font-bold">
          {answer === choices?.target ? "Correct!" : `The word was ${choices?.target}.`}
        </p>
      )}
      <Button
        className="mt-4"
        variant={answer ? "hero" : "soft"}
        onClick={() => onFinish(Boolean(answer))}
      >
        {answer ? "Finish session" : "Skip"}
      </Button>
    </>
  );
}
