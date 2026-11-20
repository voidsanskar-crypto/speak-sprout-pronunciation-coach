import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Headphones, RotateCcw, Volume2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { SpeechPrompt } from "@/components/speakup/SpeechPrompt";
import { Button } from "@/components/ui/button";
import { recordTroubleWords } from "@/hooks/use-progress";
import {
  buildMinimalPairRounds,
  DAILY_PAIR_COUNT,
  dailyPairOffset,
  MINIMAL_PAIR_COUNT,
} from "@/lib/minimal-pairs";
import { canSpeak, speak, stopSpeaking } from "@/lib/speech";
import type { ScoreResult } from "@/lib/scoring";
import { cn } from "@/lib/utils";

type Stage = "listen" | "speak" | "done";

export const Route = createFileRoute("/minimal-pairs")({
  head: () => ({ meta: [{ title: "Minimal Pairs — Speak Sprout" }] }),
  component: MinimalPairs,
});

function MinimalPairs() {
  const [rounds, setRounds] = useState<ReturnType<typeof buildMinimalPairRounds>>([]);
  const [sessionLength, setSessionLength] = useState(DAILY_PAIR_COUNT);
  const [listenOnly, setListenOnly] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("listen");
  const [played, setPlayed] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [listeningScore, setListeningScore] = useState(0);
  const [speakingIndex, setSpeakingIndex] = useState(0);
  const [spoken, setSpoken] = useState<ScoreResult | null>(null);
  const [audioError, setAudioError] = useState("");
  const round = rounds[index];
  useEffect(() => stopSpeaking, []);

  function play(word: string, isQuestion = false) {
    if (!canSpeak()) {
      setAudioError(
        "This browser can’t play spoken examples. Try a browser with English text-to-speech.",
      );
      return;
    }

    setAudioError("");
    speak(word, {
      onError: () => {
        setAudioError(
          "The spoken example couldn’t be played. Check that an English voice is available.",
        );
        if (isQuestion) setPlayed(false);
      },
    });
    if (isQuestion) setPlayed(true);
  }

  function start() {
    stopSpeaking();
    const offset = nextOffset ?? dailyPairOffset(new Date());
    setRounds(buildMinimalPairRounds(offset, sessionLength));
    setNextOffset((offset + sessionLength) % MINIMAL_PAIR_COUNT);
    setIndex(0);
    setStage("listen");
    setPlayed(false);
    setAnswer(null);
    setListeningScore(0);
    setSpeakingIndex(0);
    setSpoken(null);
    setAudioError("");
  }

  function nextPair() {
    stopSpeaking();
    setSpoken(null);
    if (index + 1 === rounds.length) {
      setStage("done");
      return;
    }
    setIndex((current) => current + 1);
    setStage("listen");
    setPlayed(false);
    setAnswer(null);
    setSpeakingIndex(0);
  }

  function continueSpeaking() {
    if (speakingIndex === 0) {
      stopSpeaking();
      setSpoken(null);
      setSpeakingIndex(1);
      return;
    }
    nextPair();
  }

  return (
    <MobileShell>
      <div className="mx-auto max-w-2xl">
        <header className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Headphones aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Minimal pairs</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick the word you hear. Add speaking practice if you want to record both words.
            </p>
          </div>
        </header>

        {!round ? (
          <section className="mt-5 rounded-[1.5rem] border border-border bg-card p-5">
            <h2 className="font-display text-xl font-semibold">Can you hear the difference?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Practice {MINIMAL_PAIR_COUNT} contrasts. The daily set rotates through the collection.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="pair-session-length" className="mb-1 block text-sm font-bold">
                  Session length
                </label>
                <select
                  id="pair-session-length"
                  className="h-12 rounded-xl border border-border bg-background px-3 text-sm font-semibold"
                  value={sessionLength}
                  onChange={(event) => setSessionLength(Number(event.target.value))}
                >
                  <option value={DAILY_PAIR_COUNT}>Quick set · {DAILY_PAIR_COUNT} pairs</option>
                  <option value={16}>Extended · 16 pairs</option>
                  <option value={MINIMAL_PAIR_COUNT}>Full set · {MINIMAL_PAIR_COUNT} pairs</option>
                </select>
              </div>
              <Button type="button" variant="hero" size="pill" onClick={start}>
                Start game <ArrowRight aria-hidden="true" />
              </Button>
            </div>
            <label className="mt-3 flex w-fit items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={listenOnly}
                onChange={(event) => setListenOnly(event.target.checked)}
                className="size-4 accent-primary"
              />
              Listening only
            </label>
          </section>
        ) : stage === "done" ? (
          <section className="mt-5 rounded-[1.5rem] border border-border bg-card p-5">
            <h2 className="font-display text-xl font-semibold">Listening score</h2>
            <p className="mt-3 font-display text-4xl font-bold text-primary">
              {listeningScore}/{rounds.length}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" variant="hero" onClick={start}>
                <RotateCcw aria-hidden="true" />{" "}
                {sessionLength === MINIMAL_PAIR_COUNT ? "Play again" : "Practice another set"}
              </Button>
              <Button type="button" variant="soft" onClick={() => setRounds([])}>
                Change session length
              </Button>
              <Button asChild variant="soft">
                <Link to="/arcade">Back to Arcade</Link>
              </Button>
            </div>
          </section>
        ) : (
          <>
            <p className="mt-5 text-xs font-extrabold text-muted-foreground">
              Pair {index + 1} of {rounds.length}
            </p>
            {stage === "listen" ? (
              <section className="mt-2 rounded-[1.5rem] border border-border bg-card p-5">
                <h2 className="font-display text-xl font-semibold">Which word did you hear?</h2>
                <Button
                  type="button"
                  variant="hero"
                  size="pill"
                  className="mt-4"
                  onClick={() => play(round.target, true)}
                >
                  <Volume2 aria-hidden="true" />{" "}
                  {played ? "Replay mystery word" : "Play mystery word"}
                </Button>
                <div className="pair-arena mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 rounded-2xl p-2 sm:gap-3 sm:p-3">
                  {round.options.map((word, place) => (
                    <button
                      key={word}
                      type="button"
                      lang="en"
                      aria-label={word}
                      style={{ gridColumn: place === 0 ? 1 : 3, gridRow: 1 }}
                      disabled={!played || answer !== null}
                      onClick={() => {
                        if (answer !== null) return;
                        setAnswer(word);
                        if (word === round.target) setListeningScore((score) => score + 1);
                      }}
                      className={cn(
                        "flex min-h-24 min-w-0 flex-col items-center justify-center gap-2 rounded-xl border px-1 py-3 text-center font-display text-lg font-extrabold uppercase transition-[transform,background-color] enabled:hover:-translate-y-0.5 enabled:focus-visible:outline-2 enabled:focus-visible:outline-offset-2 disabled:cursor-default sm:text-2xl",
                        place === 0
                          ? "border-primary/35 bg-primary-soft text-primary"
                          : "border-warning/40 bg-warning-soft text-warning",
                        answer === null && !played && "opacity-75",
                        answer !== null &&
                          word === round.target &&
                          "border-success bg-success-soft text-success",
                        answer === word &&
                          word !== round.target &&
                          "border-danger bg-danger-soft text-danger",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="rounded-full bg-card px-2 py-0.5 font-sans text-xs font-bold normal-case"
                      >
                        /{round.ipa[word]}/
                      </span>
                      <span className="max-w-full break-words">{word}</span>
                    </button>
                  ))}
                  <span
                    aria-hidden="true"
                    className="col-start-2 row-start-1 flex flex-col items-center font-display text-xs font-extrabold text-primary sm:text-base"
                  >
                    <Zap className="size-4 fill-sun text-flame sm:size-5" /> VS
                  </span>
                </div>
                {answer !== null && (
                  <div className="mt-4 rounded-2xl bg-primary-soft p-4">
                    <p role="status" className="font-bold">
                      {answer === round.target ? "Correct. You heard" : "The word was"}{" "}
                      <span lang="en">{round.target}</span>.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {round.options.map((word) => (
                        <Button
                          key={word}
                          type="button"
                          variant="soft"
                          aria-label={`Hear ${word}`}
                          onClick={() => play(word)}
                        >
                          <Volume2 aria-hidden="true" /> {word}
                        </Button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      className="mt-3"
                      variant="hero"
                      onClick={() => {
                        if (listenOnly) {
                          nextPair();
                        } else {
                          stopSpeaking();
                          setStage("speak");
                        }
                      }}
                    >
                      {listenOnly
                        ? index + 1 === rounds.length
                          ? "See results"
                          : "Next pair"
                        : "Record both words"}{" "}
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </section>
            ) : (
              <section className="mt-2">
                <h2 className="mb-2 font-display text-xl font-semibold">
                  Record word {speakingIndex + 1} of 2
                </h2>
                <p className="mb-3 text-sm text-muted-foreground">
                  Tap the mic, say the word, then replay your recording if your browser supports it.
                </p>
                <aside
                  aria-label="Mouth-position tip"
                  className="mb-3 rounded-xl bg-primary-soft p-3 text-sm"
                >
                  {round.tip}
                </aside>
                <SpeechPrompt
                  key={`${index}:${speakingIndex}`}
                  text={round.options[speakingIndex]!}
                  onScore={(score) => {
                    recordTroubleWords(score.words);
                    setSpoken(score);
                  }}
                />
                {spoken && (
                  <p
                    role="status"
                    className="mt-2 rounded-xl border border-border bg-card p-3 text-sm"
                  >
                    Browser transcript: <strong lang="en">{spoken.transcript}</strong>
                  </p>
                )}
                <Button
                  type="button"
                  variant={spoken ? "hero" : "soft"}
                  size="pill"
                  className="mt-3"
                  onClick={continueSpeaking}
                >
                  {speakingIndex === 0
                    ? "Next word"
                    : index + 1 === rounds.length
                      ? "See results"
                      : "Next pair"}{" "}
                  <ArrowRight aria-hidden="true" />
                </Button>
              </section>
            )}
            {audioError && (
              <p role="status" className="mt-3 rounded-xl bg-warning-soft p-3 text-sm text-warning">
                {audioError}
              </p>
            )}
          </>
        )}
      </div>
    </MobileShell>
  );
}
