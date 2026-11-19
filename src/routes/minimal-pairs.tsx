import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Headphones, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { SpeechPrompt } from "@/components/speakup/SpeechPrompt";
import { Button } from "@/components/ui/button";
import { canSpeak, speak, stopSpeaking } from "@/lib/speech";
import type { ScoreResult } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const corePairs = [
  ["sheep", "ship"],
  ["bat", "bet"],
  ["think", "sink"],
  ["right", "light"],
  ["berry", "very"],
] as const;

const extraPairs = [
  ["vest", "west"],
  ["fan", "van"],
  ["sip", "ship"],
  ["thin", "tin"],
  ["coat", "goat"],
  ["cap", "cab"],
  ["pull", "pool"],
  ["seat", "sit"],
] as const;

type Round = { options: readonly [string, string]; target: string };
type Stage = "listen" | "speak" | "done";

function shuffled<T>(list: readonly T[]): T[] {
  const options = [...list];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j]!, options[i]!];
  }
  return options;
}

function buildRounds(): Round[] {
  return shuffled([...corePairs, ...shuffled(extraPairs).slice(0, 8 - corePairs.length)]).map(
    (pair) => ({
      options: pair,
      target: pair[Math.random() < 0.5 ? 0 : 1],
    }),
  );
}

const coreTips: Record<string, string> = {
  sheep:
    "For /iː/ in sheep, bring your tongue high and forward. Let it sit a little lower for /ɪ/ in ship.",
  think:
    "For /θ/ in think, put the tip of your tongue lightly between your teeth and let air pass. Keep it behind your teeth for /s/ in sink.",
  right:
    "For /ɹ/ in right, keep your tongue from touching the roof of your mouth. For /l/ in light, touch just behind your front teeth.",
  berry:
    "For /b/ in berry, close both lips and release them. For /v/ in very, let air pass between your upper teeth and lower lip.",
};

export const Route = createFileRoute("/minimal-pairs")({
  head: () => ({ meta: [{ title: "Minimal Pairs — Speak Sprout" }] }),
  component: MinimalPairs,
});

function MinimalPairs() {
  const [rounds, setRounds] = useState<Round[]>([]);
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
    setRounds(buildRounds());
    setIndex(0);
    setStage("listen");
    setPlayed(false);
    setAnswer(null);
    setListeningScore(0);
    setSpeakingIndex(0);
    setSpoken(null);
    setAudioError("");
  }

  function continueSpeaking() {
    stopSpeaking();
    setSpoken(null);
    if (speakingIndex === 0) {
      setSpeakingIndex(1);
      return;
    }
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
              Pick the word you hear, then record and replay both words.
            </p>
          </div>
        </header>

        {!round ? (
          <section className="mt-5 rounded-[1.5rem] border border-border bg-card p-5">
            <h2 className="font-display text-xl font-semibold">Can you hear the difference?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try eight pairs such as sheep and ship, bat and bet, and think and sink.
            </p>
            <Button type="button" variant="hero" size="pill" className="mt-4" onClick={start}>
              Start game <ArrowRight aria-hidden="true" />
            </Button>
          </section>
        ) : stage === "done" ? (
          <section className="mt-5 rounded-[1.5rem] border border-border bg-card p-5">
            <h2 className="font-display text-xl font-semibold">Listening score</h2>
            <p className="mt-3 font-display text-4xl font-bold text-primary">
              {listeningScore}/{rounds.length}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" variant="hero" onClick={start}>
                <RotateCcw aria-hidden="true" /> Play again
              </Button>
              <Button asChild variant="soft">
                <Link to="/skills">Back to library</Link>
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
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {round.options.map((word) => (
                    <button
                      key={word}
                      type="button"
                      lang="en"
                      disabled={!played || answer !== null}
                      onClick={() => {
                        if (answer !== null) return;
                        setAnswer(word);
                        if (word === round.target) setListeningScore((score) => score + 1);
                      }}
                      className={cn(
                        "rounded-2xl border border-border px-2 py-4 text-center font-display text-xl font-semibold enabled:hover:border-primary disabled:cursor-default",
                        answer === null && !played && "opacity-50",
                        answer !== null &&
                          word === round.target &&
                          "border-success bg-success-soft text-success",
                        answer === word &&
                          word !== round.target &&
                          "border-danger bg-danger-soft text-danger",
                      )}
                    >
                      {word}
                    </button>
                  ))}
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
                        stopSpeaking();
                        setStage("speak");
                      }}
                    >
                      Record both words <ArrowRight aria-hidden="true" />
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
                {coreTips[round.options[0]] && (
                  <p className="mb-3 rounded-xl bg-primary-soft p-3 text-sm">
                    {coreTips[round.options[0]]}
                  </p>
                )}
                <SpeechPrompt
                  key={`${index}:${speakingIndex}`}
                  text={round.options[speakingIndex]!}
                  onScore={setSpoken}
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
