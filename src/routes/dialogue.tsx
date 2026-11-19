import { SpeechPrompt } from "@/components/speakup/SpeechPrompt";
import { WordMatchReview } from "@/components/speakup/WordMatchReview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { recordTroubleWords } from "@/hooks/use-progress";
import type { ScoreResult } from "@/lib/scoring";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, LoaderCircle, MessageCircle, Send, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MicButton } from "@/components/speakup/MicButton";
import { MicHelp } from "@/components/speakup/MicHelp";
import { useSpeechRecorder } from "@/hooks/use-speech-recorder";
import { groqReview, groqRoleplay } from "@/lib/ai/groq.functions";
import { speak, stopSpeaking } from "@/lib/speech";

const scenes = [
  {
    title: "Order at a café",
    role: "Barista",
    scenario: "The learner is ordering a drink and snack at a busy neighborhood café.",
  },
  {
    title: "Check into a hotel",
    role: "Receptionist",
    scenario:
      "The learner is checking into a hotel, asking about amenities and resolving a small booking issue.",
  },
  {
    title: "Meet a recruiter",
    role: "Recruiter",
    scenario:
      "The learner is in a friendly job interview and should explain their experience and ask thoughtful questions.",
  },
];
const CONTEXT_LIMIT = 20;
type Turn = { role: "user" | "assistant"; content: string };
type Review = { overall: string; strengths: string[]; languageTip: string; taskProgress: string };
export const Route = createFileRoute("/dialogue")({ component: Dialogue });
function Dialogue() {
  const [scene, setScene] = useState<(typeof scenes)[number] | null>(null);
  const [custom, setCustom] = useState("");
  const [role, setRole] = useState("Conversation partner");
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [speechRates, setSpeechRates] = useState<number[]>([]);
  const [practiceReply, setPracticeReply] = useState<string | null>(null);
  const [replyScore, setReplyScore] = useState<ScoreResult | null>(null);
  const request = useRef<symbol | null>(null);
  useEffect(
    () => () => {
      request.current = null;
      stopSpeaking();
    },
    [],
  );

  const start = (next: (typeof scenes)[number]) => {
    setScene(next);
    setTurns([]);
    setError("");
    setDraft("");
    setReview(null);
    setSpeechRates([]);
  };

  const send = async () => {
    const text = draft.trim();
    if (!scene || !text || request.current) return;
    const history: Turn[] = [...turns, { role: "user", content: text }];
    const id = Symbol();
    request.current = id;
    setBusy(true);
    setError("");
    try {
      // Keep the provider's context aligned to complete earlier question/reply pairs.
      const context = history.slice(-(CONTEXT_LIMIT - 1));
      const result = await groqRoleplay({
        data: { scenario: scene.scenario, role: scene.role, history: context },
      });
      if (request.current !== id) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTurns([...history, { role: "assistant", content: result.reply }]);
      setDraft((current) => (current.trim() === text ? "" : current));
      speak(result.reply);
    } catch {
      if (request.current === id)
        setError("Could not contact the conversation coach. Your response is ready to retry.");
    } finally {
      if (request.current === id) {
        request.current = null;
        setBusy(false);
      }
    }
  };

  const finish = async () => {
    if (!scene || !turns.length || request.current) return;
    const id = Symbol();
    request.current = id;
    setReviewing(true);
    setError("");
    try {
      const result = await groqReview({
        data: { scenario: scene.scenario, role: scene.role, history: turns.slice(-CONTEXT_LIMIT) },
      });
      if (request.current !== id) return;
      if (result.ok) setReview(result.feedback);
      else setError(result.error);
    } catch {
      if (request.current === id) setError("Could not create conversation feedback. Try again.");
    } finally {
      if (request.current === id) {
        request.current = null;
        setReviewing(false);
      }
    }
  };
  return (
    <MobileShell nav={false}>
      <Button asChild variant="soft" size="icon-lg" aria-label="Home">
        <Link to="/">
          <ArrowLeft />
        </Link>
      </Button>
      {!scene ? (
        <>
          <h1 className="mt-5 font-display text-3xl font-bold">AI conversation practice</h1>
          <p className="mb-5 mt-2 text-sm text-muted-foreground">
            Choose a roleplay or make your own. Speak or type, and your AI partner will keep the
            conversation moving.
          </p>
          <div className="space-y-3">
            {scenes.map((item) => (
              <button
                key={item.title}
                onClick={() => start(item)}
                className="w-full rounded-[2rem] bg-card p-5 text-left shadow-card"
              >
                <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-primary">
                  <MessageCircle className="size-4" /> Roleplay
                </span>
                <span className="mt-2 block font-display text-xl font-bold">{item.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Speak with a {item.role.toLowerCase()}
                </span>
              </button>
            ))}
          </div>
          <section className="mt-5 rounded-[2rem] bg-card p-5 shadow-card">
            <h2 className="font-display text-xl font-bold">Create your scenario</h2>
            <input
              className="mt-3 w-full rounded-2xl border bg-background px-4 py-3"
              aria-label="Partner role"
              maxLength={80}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="AI partner role"
            />
            <Textarea
              className="mt-3 rounded-2xl bg-background"
              aria-label="Custom scenario"
              maxLength={300}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              rows={3}
              placeholder="Describe the situation you want to practice…"
            />
            <Button
              className="mt-3 w-full"
              variant="hero"
              disabled={custom.trim().length < 6}
              onClick={() =>
                start({
                  title: "Custom roleplay",
                  role: role.trim() || "Conversation partner",
                  scenario: custom.trim(),
                })
              }
            >
              Start custom scenario <ArrowRight />
            </Button>
          </section>
        </>
      ) : (
        <>
          <h1 className="mt-5 font-display text-3xl font-bold">{scene.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You · {scene.role} · Speak naturally; the AI responds to your words.
          </p>
          {review ? (
            <section className="mt-5 rounded-[2rem] bg-card p-5 shadow-card">
              <h2 className="font-display text-2xl font-bold">Conversation feedback</h2>
              <p className="mt-3 text-sm leading-relaxed">{review.overall}</p>
              <h3 className="mt-4 font-bold">What went well</h3>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {review.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl bg-primary-soft p-4">
                <b>Language tip</b>
                <p className="mt-1 text-sm">{review.languageTip}</p>
              </div>
              <div className="mt-3 rounded-2xl bg-secondary p-4">
                <b>Scenario progress</b>
                <p className="mt-1 text-sm">{review.taskProgress}</p>
              </div>
              {speechRates.length > 0 && (
                <div className="mt-3 rounded-2xl bg-muted p-4">
                  <b>Estimated speaking rate</b>
                  <p className="mt-1 text-sm">
                    About {Math.round(speechRates.reduce((a, b) => a + b, 0) / speechRates.length)}{" "}
                    words per minute across {speechRates.length} recorded response
                    {speechRates.length === 1 ? "" : "s"}. Use this as a personal reference, not a
                    pronunciation grade.
                  </p>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Feedback covers the conversation transcript.{" "}
                {turns.length > CONTEXT_LIMIT && "This review uses the most recent 20 messages."}
              </p>
              <Button
                className="mt-4 w-full"
                variant="hero"
                onClick={() => {
                  setScene(null);
                  setTurns([]);
                  setReview(null);
                }}
              >
                Choose another scenario
              </Button>
            </section>
          ) : (
            <>
              <div className="mt-4 max-h-[38vh] space-y-3 overflow-y-auto rounded-[2rem] bg-card p-4 shadow-card">
                {turns.length === 0 && (
                  <div className="rounded-2xl bg-secondary p-4 text-secondary-foreground">
                    <p className="text-xs font-extrabold uppercase">{scene.role}</p>
                    <p className="mt-1">Hi! Welcome. What brings you here today?</p>
                    <Button
                      className="mt-2"
                      size="sm"
                      variant="soft"
                      onClick={() => speak("Hi! Welcome. What brings you here today?")}
                    >
                      <Volume2 /> Hear example
                    </Button>
                  </div>
                )}
                {turns.map((turn, i) => (
                  <div
                    key={i}
                    className={`max-w-[90%] rounded-2xl p-4 ${turn.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                  >
                    <p className="text-xs font-extrabold uppercase">
                      {turn.role === "user" ? "You" : scene.role}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{turn.content}</p>
                    {turn.role === "user" && (
                      <button
                        type="button"
                        className="mt-2 text-xs font-semibold underline underline-offset-2"
                        onClick={() => {
                          stopSpeaking();
                          setPracticeReply(turn.content.split(/\s+/).slice(0, 16).join(" "));
                          setReplyScore(null);
                        }}
                      >
                        Practice this reply
                      </button>
                    )}
                    {turn.role === "assistant" && (
                      <button
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold"
                        onClick={() => speak(turn.content)}
                      >
                        <Volume2 className="size-4" /> Listen
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {error && (
                <p
                  role="status"
                  className="mt-3 rounded-2xl bg-warning-soft p-3 text-sm font-semibold"
                >
                  {error}
                </p>
              )}
              <div className="mt-3">
                {!practiceReply && (
                  <OpenMic
                    onTranscript={setDraft}
                    onRate={(rate) => setSpeechRates((previous) => [...previous, rate])}
                  />
                )}
                <Textarea
                  aria-label="Your response"
                  maxLength={1200}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  className="mt-2 rounded-2xl bg-card"
                  placeholder="Type or record a response…"
                />
                <Button
                  className="mt-3 w-full"
                  variant="hero"
                  disabled={!draft.trim() || busy || reviewing}
                  onClick={() => void send()}
                >
                  {busy ? (
                    <>
                      <LoaderCircle className="animate-spin" /> Thinking…
                    </>
                  ) : (
                    <>
                      Send response <Send />
                    </>
                  )}
                </Button>
              </div>
              {turns.some((t) => t.role === "user") && (
                <Button
                  className="mt-3 w-full"
                  variant="soft"
                  disabled={busy || reviewing}
                  onClick={() => void finish()}
                >
                  {reviewing ? (
                    <>
                      <LoaderCircle className="animate-spin" /> Reviewing…
                    </>
                  ) : (
                    "Finish and get feedback"
                  )}
                </Button>
              )}
              <Button
                className="mt-3 w-full"
                variant="soft"
                disabled={busy || reviewing}
                onClick={() => {
                  setScene(null);
                  setTurns([]);
                  setError("");
                }}
              >
                Choose another scenario
              </Button>
            </>
          )}
        </>
      )}
      <Dialog
        open={practiceReply !== null}
        onOpenChange={(open) => {
          if (!open) {
            stopSpeaking();
            setPracticeReply(null);
          }
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Practice this reply</DialogTitle>
            <DialogDescription>
              Read the words shown. Words under 70% word match go in your Personal Review Deck.
            </DialogDescription>
          </DialogHeader>
          {practiceReply && (
            <SpeechPrompt
              key={practiceReply}
              text={practiceReply}
              onScore={(score) => {
                recordTroubleWords(score.words);
                setReplyScore(score);
              }}
            />
          )}
          {replyScore && (
            <>
              <p role="status" className="text-sm font-bold">
                {replyScore.score}% word match
              </p>
              <WordMatchReview result={replyScore} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}

function OpenMic({
  onTranscript,
  onRate,
}: {
  onTranscript: (text: string) => void;
  onRate: (wordsPerMinute: number) => void;
}) {
  const recorder = useSpeechRecorder((alternatives, audioUrl) => {
    const text = alternatives[0] ?? "";
    onTranscript(text);
    if (audioUrl && text) {
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0)
          onRate((text.trim().split(/\s+/).length * 60) / audio.duration);
      };
    }
  });
  return (
    <div className="flex flex-col items-center rounded-2xl bg-primary-soft p-3">
      <p className="text-center text-xs font-semibold text-muted-foreground">
        {recorder.interim || "Record your reply; we’ll turn it into editable text."}
      </p>
      {recorder.error ? (
        <MicHelp
          error={recorder.error}
          onRetry={() => {
            recorder.clearError();
            void recorder.start();
          }}
          onDismiss={recorder.clearError}
        />
      ) : (
        <MicButton
          status={recorder.status}
          onStart={() => void recorder.start()}
          onStop={recorder.stop}
        />
      )}
    </div>
  );
}
