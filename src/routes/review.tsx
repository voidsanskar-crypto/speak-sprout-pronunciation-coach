import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, CalendarClock, Check, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SpeechPrompt } from "@/components/speakup/SpeechPrompt";
import { WordMatchReview } from "@/components/speakup/WordMatchReview";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { reviewDeckWord, useProgress } from "@/hooks/use-progress";
import type { ScoreResult } from "@/lib/scoring";
import { toDateKey } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { canSpeak, speak, stopSpeaking } from "@/lib/speech";

export const Route = createFileRoute("/review")({
  head: () => ({ meta: [{ title: "Personal Review Deck — Speak Sprout" }] }),
  component: ReviewDeck,
});

function ReviewDeck() {
  const { reviewDeck } = useProgress();
  const hydrated = useHydrated();
  const today = hydrated ? toDateKey(new Date()) : "";
  const ordered = [...reviewDeck].sort(
    (a, b) => a.due.localeCompare(b.due) || a.word.localeCompare(b.word),
  );
  const due = ordered.filter((card) => card.due <= today);
  const upcoming = ordered.filter((card) => card.due > today);
  const active = due[0];
  const [revealedWord, setRevealedWord] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<ScoreResult | null>(null);
  const [feedback, setFeedback] = useState("");
  const [departing, setDeparting] = useState<{ word: string; remembered: boolean } | null>(null);
  useEffect(() => stopSpeaking, []);

  function rate(word: string, remembered: boolean) {
    stopSpeaking();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDeparting({ word, remembered });
    }
    reviewDeckWord(word, remembered);
    setRevealedWord(null);
    setReviewResult(null);
    setFeedback(remembered ? "Review saved." : "You’ll see that word again tomorrow.");
  }

  return (
    <MobileShell>
      <div className="mx-auto max-w-2xl">
        <header className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
            <CalendarClock aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Personal Review Deck</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Words under 70% word match from Practice, the Speaking Check, Your Own Text, and
              dialogue reply drills show up here. Minimal Pairs recordings can add cards too.
            </p>
          </div>
        </header>

        <section className="relative mt-5 isolate overflow-hidden rounded-[1.5rem] border border-border bg-card p-4 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Due today</h2>
          {active ? (
            <>
              <p className="mt-1 text-sm font-bold text-primary">
                {due.length} {due.length === 1 ? "word" : "words"} to review
              </p>
              <div
                className="review-stack relative isolate mb-4 mt-6"
                data-layered={due.length > 1}
              >
                <div
                  key={active.word}
                  className="relative space-y-3 rounded-2xl border border-primary/25 bg-primary-soft p-4 shadow-card"
                >
                  <p className="text-sm font-semibold">
                    Listen first, then reveal the word and record yourself. Three green reviews in a
                    row clear the card.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => {
                        if (canSpeak()) {
                          setFeedback("");
                          speak(active.word);
                        } else
                          setFeedback(
                            "Audio is unavailable in this browser. You can still reveal and review the word.",
                          );
                      }}
                    >
                      <Volume2 aria-hidden="true" /> Hear the word
                    </Button>
                    {revealedWord !== active.word && (
                      <Button
                        type="button"
                        variant="soft"
                        onClick={() => setRevealedWord(active.word)}
                      >
                        Reveal word
                      </Button>
                    )}
                  </div>
                  {revealedWord === active.word && (
                    <>
                      <SpeechPrompt
                        key={active.word}
                        text={active.word}
                        onScore={setReviewResult}
                      />
                      {reviewResult && (
                        <>
                          <p role="status" className="text-sm font-bold">
                            {reviewResult.words[0]?.status === "correct"
                              ? "Green match. Save this review to continue your streak."
                              : "The word didn’t match. You can retry now or review it again tomorrow."}
                          </p>
                          <WordMatchReview result={reviewResult} />
                          <Button
                            type="button"
                            variant="hero"
                            onClick={() =>
                              rate(active.word, reviewResult.words[0]?.status === "correct")
                            }
                          >
                            {reviewResult.words[0]?.status === "correct" ? (
                              <Check aria-hidden="true" />
                            ) : (
                              <RotateCcw aria-hidden="true" />
                            )}
                            {reviewResult.words[0]?.status === "correct"
                              ? "Save green review"
                              : "Review tomorrow"}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          ) : hydrated ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                {upcoming.length
                  ? "You’re caught up for today."
                  : "Your deck is empty. Words you miss during speaking practice will be due the next day."}
              </p>
              <Button asChild variant="soft" className="mt-4">
                <Link to="/practice">Go to practice</Link>
              </Button>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Loading your deck…</p>
          )}
          {departing && (
            <div
              key={departing.word}
              aria-hidden="true"
              onAnimationEnd={() => setDeparting(null)}
              className={cn(
                "review-card-exit pointer-events-none absolute inset-x-5 top-20 z-10 grid min-h-32 place-content-center justify-items-center gap-2 rounded-2xl border p-4 shadow-pop",
                departing.remembered
                  ? "border-success/30 bg-success-soft text-success"
                  : "review-card-exit-left border-primary/30 bg-primary-soft text-primary",
              )}
            >
              {departing.remembered ? (
                <Check className="size-9" />
              ) : (
                <Bookmark className="size-9" />
              )}
              <span className="font-display text-xl font-bold">{departing.word}</span>
            </div>
          )}
          <p role="status" className={feedback ? "mt-3 text-sm text-muted-foreground" : "sr-only"}>
            {feedback}
          </p>
        </section>

        {upcoming.length > 0 && (
          <section className="mt-5 rounded-[1.5rem] border border-border bg-card p-5">
            <h2 className="font-display text-xl font-semibold">Coming up</h2>
            <ul className="mt-2 max-h-64 divide-y divide-border overflow-y-auto">
              {upcoming.map((card) => (
                <li
                  key={card.word}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span lang="en" className="min-w-0 break-words font-semibold">
                    {card.word}
                  </span>
                  <time dateTime={card.due} className="shrink-0 text-muted-foreground">
                    {formatDay(card.due)}
                  </time>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </MobileShell>
  );
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}
