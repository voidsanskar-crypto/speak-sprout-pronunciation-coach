import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Ear, Zap } from "lucide-react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Button } from "@/components/ui/button";
import { awardXp } from "@/hooks/use-progress";
import { stopSpeaking } from "@/lib/speech";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ear-sprint")({
  head: () => ({ meta: [{ title: "Ear Sprint — SayTempo" }] }),
  component: EarSprint,
});

const pairs = [
  ["ship", "sheep"],
  ["thin", "tin"],
  ["fan", "van"],
  ["right", "light"],
  ["bat", "bet"],
  ["vest", "west"],
  ["cap", "cab"],
  ["pull", "pool"],
] as const;
type Round = { options: readonly [string, string]; target: string };
const gameLength = 60_000;
const answerTime = 3_000;

function EarSprint() {
  const [stage, setStage] = useState<"ready" | "running" | "done">("ready");
  const [round, setRound] = useState<Round | null>(null);
  const [feedback, setFeedback] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [responseMs, setResponseMs] = useState(0);
  const [summary, setSummary] = useState({ xp: 0, combo: 0, best: 0, correct: 0 });
  const [audioError, setAudioError] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const current = useRef<Round | null>(null);
  const lastPair = useRef(-1);
  const gameEnds = useRef(0);
  const answerEnds = useRef(0);
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stats = useRef(summary);

  useEffect(
    () => () => {
      if (nextTimer.current !== null) clearTimeout(nextTimer.current);
      if (audio.current) {
        audio.current.onended = null;
        audio.current.pause();
      }
      gameEnds.current = 0;
    },
    [],
  );

  function finish() {
    gameEnds.current = 0;
    answerEnds.current = 0;
    current.current = null;
    if (nextTimer.current !== null) clearTimeout(nextTimer.current);
    if (audio.current) {
      audio.current.onended = null;
      audio.current.pause();
    }
    setRound(null);
    setStage("done");
  }

  function nextRound() {
    if (performance.now() >= gameEnds.current) {
      finish();
      return;
    }
    answerEnds.current = 0;
    setResponseMs(0);
    setFeedback("");
    let index = Math.floor(
      Math.random() * (lastPair.current < 0 ? pairs.length : pairs.length - 1),
    );
    if (lastPair.current >= 0 && index >= lastPair.current) index++;
    lastPair.current = index;
    const pair = pairs[index]!;
    const next = {
      options: Math.random() < 0.5 ? pair : ([pair[1], pair[0]] as const),
      target: pair[Math.random() < 0.5 ? 0 : 1],
    };
    current.current = next;
    setRound(next);
    const player = audio.current ?? new Audio();
    audio.current = player;
    player.src = `${import.meta.env.BASE_URL}ear-sprint/${next.target}.mp3`;
    player.onended = () => {
      if (current.current !== next || !gameEnds.current) return;
      answerEnds.current = Math.min(performance.now() + answerTime, gameEnds.current);
      setResponseMs(Math.max(0, answerEnds.current - performance.now()));
    };
    void player.play().catch(() => {
      if (current.current !== next) return;
      setAudioError(true);
      finish();
    });
  }

  function start() {
    stopSpeaking();
    stats.current = { xp: 0, combo: 0, best: 0, correct: 0 };
    setSummary(stats.current);
    setFeedback("");
    setSeconds(60);
    setAudioError(false);
    lastPair.current = -1;
    gameEnds.current = performance.now() + gameLength;
    setStage("running");
    nextRound();
  }

  function answer(word: string | null) {
    const active = current.current;
    const now = performance.now();
    if (!active || !answerEnds.current || now >= gameEnds.current) return;
    current.current = null;
    const correct = now < answerEnds.current && word === active.target;
    answerEnds.current = 0;
    setResponseMs(0);
    const previous = stats.current;
    const combo = correct ? previous.combo + 1 : 0;
    const earned = !correct ? 0 : combo >= 3 ? 40 : combo === 2 ? 20 : 10;
    if (earned) awardXp(earned);
    stats.current = {
      xp: previous.xp + earned,
      combo,
      best: Math.max(previous.best, combo),
      correct: previous.correct + Number(correct),
    };
    setSummary(stats.current);
    setFeedback(correct ? `Correct · +${earned} XP` : `The word was ${active.target}.`);
    nextTimer.current = setTimeout(nextRound, 320);
  }

  useEffect(() => {
    if (stage !== "running") return;
    const ticker = setInterval(() => {
      const now = performance.now();
      const remaining = gameEnds.current - now;
      setSeconds(Math.max(0, Math.ceil(remaining / 1000)));
      if (remaining <= 0) {
        finish();
        return;
      }
      if (answerEnds.current) {
        setResponseMs(Math.max(0, answerEnds.current - now));
        if (now >= answerEnds.current) answer(null);
      }
    }, 60);
    return () => clearInterval(ticker);
  }, [stage]);

  return (
    <MobileShell>
      <div className="mx-auto max-w-2xl">
        <Link
          to="/arcade"
          className="inline-flex items-center gap-1 text-sm font-bold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" /> Arcade
        </Link>
        <h1 className="mt-3 font-display text-4xl font-bold">Ear Sprint</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hear the word and pick it within three seconds. No microphone needed.
        </p>
        <section className="mt-5 rounded-[1.75rem] border border-border bg-card p-4 sm:p-6">
          {stage === "running" ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 font-extrabold tabular-nums">
                <span role="timer" aria-label="Sprint time remaining">
                  {seconds}s
                </span>
                <span>{summary.combo} in a row</span>
                <span className="inline-flex items-center gap-1 text-primary">
                  <Zap aria-hidden="true" className="size-4" /> {summary.xp} XP
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(responseMs / answerTime) * 100}%` }}
                />
              </div>
              <p className="mt-3 min-h-5 text-sm font-bold text-muted-foreground" role="status">
                {responseMs > 0 ? "Which word did you hear?" : feedback || "Listen…"}
              </p>
              {round && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {round.options.map((word, index) => (
                    <button
                      key={word}
                      type="button"
                      disabled={responseMs <= 0}
                      onClick={() => answer(word)}
                      className={cn(
                        "min-h-28 rounded-2xl border px-1 font-display text-xl font-bold enabled:hover:brightness-95 sm:text-3xl",
                        index
                          ? "border-warning/35 bg-warning-soft text-warning"
                          : "border-primary/35 bg-primary-soft text-primary",
                      )}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <Ear aria-hidden="true" className="size-8 text-primary" />
              <h2 className="mt-3 font-display text-2xl font-bold">
                {stage === "ready" ? "Ready to listen?" : "Sprint finished"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {stage === "ready"
                  ? "You have 60 seconds. Correct answers earn 10, 20, then 40 XP while your combo lasts."
                  : `${summary.correct} correct · Best combo: ${summary.best} · +${summary.xp} XP`}
              </p>
              {audioError && (
                <p className="mt-2 text-sm text-danger" role="status">
                  Audio couldn’t play. Check your sound settings and try again.
                </p>
              )}
              <Button variant="energy" size="pill" className="mt-4" onClick={start}>
                {stage === "ready" ? "Start 60-second sprint" : "Play again"}
              </Button>
            </>
          )}
        </section>
      </div>
    </MobileShell>
  );
}
