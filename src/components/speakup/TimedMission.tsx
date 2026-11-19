import { Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { MicButton } from "@/components/speakup/MicButton";
import { MicHelp } from "@/components/speakup/MicHelp";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeechRecorder } from "@/hooks/use-speech-recorder";
import { speak, stopSpeaking } from "@/lib/speech";
import { timedMissions, type TimedScenario } from "@/lib/timed-missions";

export function TimedMission({ scenario }: { scenario: TimedScenario }) {
  const mission = timedMissions[scenario];
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
      <div className="mx-auto max-w-2xl">
        <Link
          to="/arcade"
          className="inline-flex items-center gap-1 text-sm font-bold text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Arcade
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{mission.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{mission.goal}</p>
        <section className="mt-4 rounded-[1.75rem] border border-border bg-card p-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1.5 font-bold text-warning">
            <Clock aria-hidden="true" className="size-4" />{" "}
            <span role="timer">{remaining}s left</span>
          </p>
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
                  status={recorder.status}
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
              {phase !== "ready" && (
                <p role="status" className="mt-4 font-bold">
                  {phase === "won" ? mission.success : "Time’s up. Try the mission again."}
                </p>
              )}
              <Button variant="hero" size="pill" className="mt-4 block" onClick={start}>
                {phase === "ready" ? "Start mission" : "Play again"}
              </Button>
            </>
          )}
        </section>
      </div>
    </MobileShell>
  );
}
