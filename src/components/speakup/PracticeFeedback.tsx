import { WordMatchReview } from "@/components/speakup/WordMatchReview";
import { ArrowRight, Check, Minus, RotateCcw, Snail, Volume2, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/speakup/Mascot";
import { ScoreGauge } from "@/components/speakup/ScoreGauge";
import { WordDetail } from "@/components/speakup/WordDetail";
import { Button } from "@/components/ui/button";
import { fireConfetti, shouldCelebrate } from "@/lib/celebrate";
import { displayWords, ipaWords, type Phrase } from "@/lib/phrases";
import { xpForScore } from "@/lib/progress";
import { tokenize, type ScoreResult, type WordStatus } from "@/lib/scoring";
import { speak, stopSpeaking } from "@/lib/speech";
import { cn } from "@/lib/utils";

const matchAppearance = {
  correct: {
    label: "Matched",
    Icon: Check,
    className: "border-success/30 bg-success-soft text-success",
  },
  close: {
    label: "Close match",
    Icon: Minus,
    className: "border-warning/40 bg-warning-soft text-warning",
  },
  missed: { label: "Unmatched", Icon: X, className: "border-danger/30 bg-danger-soft text-danger" },
} satisfies Record<WordStatus, { label: string; Icon: typeof Check; className: string }>;

function feedbackWords(phrase: Phrase, result: ScoreResult) {
  const ipa = ipaWords(phrase);
  let offset = 0;

  // A hyphenated display word can span two scored tokens but has one IPA entry.
  return displayWords(phrase.text).flatMap((display, index) => {
    const length = tokenize(display).length;
    const matches = result.words.slice(offset, offset + length);
    offset += length;
    const [first, ...rest] = matches;
    if (!first) return [];

    const weakest = rest.reduce(
      (lowest, match) => (match.similarity < lowest.similarity ? match : lowest),
      first,
    );
    return [
      {
        display,
        ipa: ipa[index] ?? "",
        match: {
          ...weakest,
          target: matches.map((word) => word.target).join("-"),
          heard:
            matches
              .map((word) => word.heard)
              .filter(Boolean)
              .join(" ") || null,
        },
      },
    ];
  });
}

export function PracticeFeedback({
  phrase,
  result,
  recordingUrl,
  onRetry,
  onContinue,
  isLast,
}: {
  phrase: Phrase;
  result: ScoreResult;
  recordingUrl: string | null;
  onRetry: () => void;
  onContinue: () => void;
  isLast: boolean;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const recording = useRef<HTMLAudioElement>(null);
  const words = feedbackWords(phrase, result);
  const selected = selectedIndex === null ? undefined : words[selectedIndex];
  const firstReviewIndex = words.findIndex(({ match }) => match.status !== "correct");
  const review = words[firstReviewIndex];

  useEffect(() => {
    if (!shouldCelebrate(result.score)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => void fireConfetti(), 700);
    return () => clearTimeout(timer);
  }, [result.score]);

  function playExample(slow: boolean) {
    recording.current?.pause();
    speak(phrase.text, { slow });
  }

  function openWord(index: number) {
    recording.current?.pause();
    stopSpeaking();
    setSelectedIndex(index);
  }

  return (
    <div className="mt-6 space-y-4">
      <section className="relative overflow-hidden rounded-[2rem] bg-card px-5 py-5 shadow-card">
        <Mascot
          mood={result.score >= 75 ? "cheer" : "wave"}
          className="pointer-events-none absolute right-2 top-2 hidden w-16 min-[380px]:block"
        />
        <ScoreGauge score={result.score} />
        <p className="mx-auto mt-2 max-w-64 text-center text-xs leading-relaxed text-muted-foreground">
          Compares the browser transcript with the prompt. Individual sounds and rhythm are
          unscored.
        </p>
        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-3 py-1 text-xs font-extrabold">
            <Zap className="size-3.5 fill-sun text-sun" /> +{xpForScore(result.score)} XP
          </span>
        </div>
      </section>

      <section className="rounded-[2rem] bg-card p-5 shadow-card">
        <h2 className="font-display text-xl font-semibold">Review the phrase</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {words.map(({ display, match }, index) => {
            const { label, Icon, className } = matchAppearance[match.status];
            return (
              <button
                type="button"
                key={index}
                onClick={() => openWord(index)}
                aria-label={`${display} ${label.toLowerCase()}`}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1 rounded-xl border px-2.5 py-1 font-display text-base font-semibold",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  className,
                )}
              >
                <Icon aria-hidden="true" className="size-3 shrink-0" />
                {display}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {review
            ? "Tap a word to hear it and get pronunciation tips."
            : "Tap any word to hear it on its own."}
        </p>
        <div className="mt-4 space-y-1 rounded-2xl bg-muted px-4 py-3 text-sm">
          <p className="text-xs font-bold text-muted-foreground">Transcript used for scoring</p>
          <p className="break-words font-medium">{result.transcript}</p>
        </div>
        <WordMatchReview
          result={result}
          onReplay={(word) => {
            recording.current?.pause();
            speak(word, { slow: true });
          }}
        />
        {review && (
          <Button
            variant="ghost"
            className="mt-3 max-w-full justify-start px-0 text-primary"
            onClick={() => openWord(firstReviewIndex)}
          >
            <span className="truncate">
              Review {review.display.replace(/[^\p{L}\p{N}'’–-]/gu, "")}
            </span>
            <ArrowRight />
          </Button>
        )}
      </section>

      <section className="rounded-[2rem] bg-primary-soft p-5">
        <h2 className="font-display text-xl font-semibold">
          {recordingUrl ? "Listen and compare" : "Hear the example"}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="soft" className="h-10 px-3" onClick={() => playExample(false)}>
            <Volume2 /> Example
          </Button>
          <Button variant="soft" className="h-10 px-3" onClick={() => playExample(true)}>
            <Snail /> Slow example
          </Button>
        </div>
        {recordingUrl && (
          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-bold text-muted-foreground">Your recording</p>
            <audio
              ref={recording}
              controls
              src={recordingUrl}
              preload="metadata"
              onPlay={stopSpeaking}
              aria-label="Your recording"
              className="h-10 w-full"
            />
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="soft" size="pill" className="px-2" onClick={onRetry}>
          <RotateCcw /> Try again
        </Button>
        <Button variant="hero" size="pill" className="px-2" onClick={onContinue}>
          {isLast ? "Finish" : "Continue"} <ArrowRight />
        </Button>
      </div>

      <WordDetail
        open={selected !== undefined}
        onOpenChange={(open) => !open && setSelectedIndex(null)}
        word={selected?.match ?? null}
        display={selected?.display ?? ""}
        ipa={selected?.ipa ?? ""}
      />
    </div>
  );
}
