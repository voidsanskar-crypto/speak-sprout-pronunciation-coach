import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Circle, Clock, Coffee, TrainFront, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { MicButton } from "@/components/speakup/MicButton";
import { MicHelp } from "@/components/speakup/MicHelp";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeechRecorder } from "@/hooks/use-speech-recorder";
import { speak, stopSpeaking } from "@/lib/speech";
import { cn } from "@/lib/utils";
import { timedMissions, type TimedScenario } from "@/lib/timed-missions";

export function TimedMission({ scenario }: { scenario: TimedScenario }) {
  const mission = timedMissions[scenario];
  const Icon = scenario === "coffee" ? Coffee : TrainFront;
  const [phase, setPhase] = useState<"ready" | "playing" | "won" | "expired">("ready");
  const [remaining, setRemaining] = useState<number>(mission.seconds);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState(false);
  const deadline = useRef(0);
  const turnIndex = useRef(0);
  const turn = mission.turns[step];

  function respond(text: string, spoken: boolean) {
    if (!deadline.current || performance.now() >= deadline.current || !text.trim()) return;
    const active = mission.turns[turnIndex.current];
    if (!active) return;
    if (!active.accepts(text.trim().toLowerCase())) {
      setHint(true);
      return;
    }

    const next = ++turnIndex.current;
    setStep(next);
    setHint(false);
    if (next === mission.turns.length) {
      deadline.current = 0;
      setPhase("won");
      if (spoken) speak(mission.success);
    } else if (spoken) {
      speak(mission.turns[next]!.prompt);
    }
  }

  const recorder = useSpeechRecorder(
    ([text]) => {
      if (text) respond(text, true);
    },
    { captureAudio: false },
  );
  const cancel = recorder.cancel;
  useEffect(() => stopSpeaking, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setInterval(() => {
      if (!deadline.current) return;
      const ms = deadline.current - performance.now();
      setRemaining(Math.max(0, Math.ceil(ms / 1000)));
      if (ms > 0) return;
      deadline.current = 0;
      cancel();
      stopSpeaking();
      setPhase("expired");
    }, 100);
    return () => clearInterval(timer);
  }, [phase, cancel]);

  function start() {
    deadline.current = performance.now() + mission.seconds * 1000;
    turnIndex.current = 0;
    setStep(0);
    setRemaining(mission.seconds);
    setHint(false);
    setDraft("");
    recorder.clearError();
    setPhase("playing");
    speak(mission.turns[0]!.prompt);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    recorder.clearError();
    respond(draft, false);
    setDraft("");
  }

  return (
    <MobileShell>
      <div className="mx-auto max-w-5xl">
        <Link
          to="/arcade"
          className="inline-flex items-center gap-1 text-sm font-bold text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Arcade
        </Link>
        <header
          className={cn(
            "mt-3 flex items-center gap-4 rounded-[1.75rem] border p-4 sm:gap-5 sm:p-7",
            scenario === "coffee"
              ? "border-warning/25 bg-linear-to-br from-warning-soft to-card"
              : "border-primary/20 bg-linear-to-br from-primary-soft to-card",
          )}
        >
          <span
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-2xl sm:size-16",
              scenario === "coffee"
                ? "bg-warning-soft text-warning"
                : "bg-primary-soft text-primary",
            )}
          >
            <Icon aria-hidden="true" className="size-6 sm:size-8" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">{mission.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{mission.goal}</p>
          </div>
        </header>
        <div className="mt-4 grid items-start gap-3.5 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <section
            aria-labelledby="mission-conversation"
            className="rounded-[1.75rem] border border-border bg-card p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="mission-conversation" className="font-display text-xl font-bold">
                Conversation
              </h2>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1.5 text-sm font-bold text-warning">
                <Clock aria-hidden="true" className="size-4" />
                <span role="timer">
                  {phase === "ready" ? `${mission.seconds}s limit` : `${remaining}s left`}
                </span>
              </p>
            </div>
            {phase === "playing" && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-warning motion-safe:transition-[width] motion-safe:duration-500"
                  style={{ width: `${(100 * remaining) / mission.seconds}%` }}
                />
              </div>
            )}
            {phase === "playing" && turn ? (
              <>
                <div role="status" className="mt-4 rounded-2xl bg-primary-soft p-4">
                  <p className="text-xs font-bold text-primary">
                    {mission.speaker} · {step + 1}/{mission.turns.length}
                  </p>
                  <p className="mt-1 font-bold">{turn.prompt}</p>
                  {hint && <p className="mt-2 text-sm text-muted-foreground">{turn.hint}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <MicButton
                    status={recorder.status} analyser={recorder.analyser} speaking={recorder.speaking}
                    onStart={() => void recorder.start()}
                    onStop={recorder.stop}
                  />
                  <Button
                    size="sm"
                    variant="soft"
                    disabled={recorder.status !== "idle"}
                    onClick={() => speak(turn.prompt)}
                  >
                    <Volume2 aria-hidden="true" /> Hear question
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setHint(true)}>
                    Show a hint
                  </Button>
                </div>
                {recorder.error && (
                  <MicHelp
                    error={recorder.error}
                    onRetry={() => void recorder.start()}
                    onDismiss={recorder.clearError}
                  />
                )}
                <form onSubmit={submit} className="flex gap-2">
                  <Input
                    aria-label="Type your reply"
                    placeholder="Or type your reply"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <Button type="submit" disabled={!draft.trim() || recorder.status !== "idle"}>
                    Send
                  </Button>
                </form>
              </>
            ) : (
              <>
                {phase === "ready" ? (
                  <>
                    <div className="mt-4 rounded-2xl bg-muted p-4">
                      <p className="text-xs font-bold text-primary">{mission.speaker}</p>
                      <p className="mt-1 text-sm font-semibold">{mission.turns[0]!.prompt}</p>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Start the clock, then speak or type your replies. You can replay each
                      question.
                    </p>
                  </>
                ) : (
                  <p role="status" className="mt-4 rounded-2xl bg-muted p-4 font-bold">
                    {phase === "won" ? mission.success : "Time’s up. Try the mission again."}
                  </p>
                )}
                <Button variant="hero" size="pill" className="mt-4" onClick={start}>
                  {phase === "ready" ? "Start mission" : "Play again"}
                </Button>
              </>
            )}
          </section>
          <aside
            aria-labelledby="mission-briefing"
            className="rounded-[1.75rem] border border-border bg-card p-4 sm:p-5"
          >
            <h2 id="mission-briefing" className="font-display text-xl font-bold">
              {mission.panel.title}
            </h2>
            <dl
              className={cn(
                "mt-3 divide-y divide-border rounded-xl px-3",
                scenario === "coffee" ? "bg-warning-soft" : "bg-primary-soft",
              )}
            >
              {mission.panel.details.map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-3 py-2 text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-bold">{value}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-4 text-sm font-bold">Mission steps</h3>
            <ol className="mt-2 space-y-2">
              {mission.turns.map(({ objective }, index) => (
                <li
                  key={objective}
                  aria-current={phase === "playing" && step === index ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    index < step && "text-success",
                    phase === "playing" && step === index && "font-bold text-primary",
                  )}
                >
                  {index < step ? (
                    <>
                      <Check aria-hidden="true" className="size-4 shrink-0" />
                      <span className="sr-only">Complete: </span>
                    </>
                  ) : (
                    <Circle aria-hidden="true" className="size-4 shrink-0" />
                  )}
                  {objective}
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </MobileShell>
  );
}
