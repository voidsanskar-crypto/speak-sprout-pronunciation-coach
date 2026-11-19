import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Home,
  Languages,
  RotateCcw,
  SkipForward,
  Snail,
  Trophy,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Mascot } from "@/components/speakup/Mascot";
import { MicButton } from "@/components/speakup/MicButton";
import { MicHelp } from "@/components/speakup/MicHelp";
import { Waveform } from "@/components/speakup/Waveform";
import { ScoreGauge, scoreTone } from "@/components/speakup/ScoreGauge";
import { WordDetail } from "@/components/speakup/WordDetail";
import { LanguagePicker } from "@/components/speakup/LanguagePicker";
import { Button } from "@/components/ui/button";
import { getProgressSnapshot, recordAttempt, setTranslationLanguage, useProgress } from "@/hooks/use-progress";
import { useSpeechRecorder } from "@/hooks/use-speech-recorder";
import { usePhraseTranslation } from "@/hooks/use-translations";
import { fireConfetti, shouldCelebrate } from "@/lib/celebrate";
import { displayWords, ipaWords, type Phrase } from "@/lib/phrases";
import { xpForScore } from "@/lib/progress";
import { scoreBest, type ScoreResult, type WordResult } from "@/lib/scoring";
import { buildQueue } from "@/lib/session";
import { SOUND_IDS, SOUNDS, type SoundId } from "@/lib/sounds";
import { canSpeak, speak, stopSpeaking } from "@/lib/speech";
import { getTopic, TOPICS, type TopicId } from "@/lib/topics";
import { cn } from "@/lib/utils";

interface PracticeSearch {
  topic?: TopicId | undefined;
  sound?: SoundId | undefined;
}

export const Route = createFileRoute("/practice")({
  validateSearch: (search: Record<string, unknown>): PracticeSearch => {
    const rawTopic = search["topic"];
    const rawSound = search["sound"];
    const topic = TOPICS.some((t) => t.id === rawTopic) ? (rawTopic as TopicId) : undefined;
    const sound = SOUND_IDS.includes(rawSound as SoundId) ? (rawSound as SoundId) : undefined;
    return { ...(topic ? { topic } : {}), ...(sound ? { sound } : {}) };
  },
  head: () => ({
    meta: [
      { title: "Practice — SpeakUp" },
      { name: "description", content: "Listen to native-style audio, record yourself and get instant word-by-word pronunciation feedback." },
      { property: "og:title", content: "Practice — SpeakUp" },
      { property: "og:description", content: "Listen, speak and get instant word-by-word pronunciation feedback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Practice,
});

type Stage = "practice" | "feedback" | "summary";

function Practice() {
  const { topic, sound } = Route.useSearch();
  const progress = useProgress();
  const [queue, setQueue] = useState<Phrase[] | null>(null);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("practice");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  useEffect(() => {
    setQueue(buildQueue({ topic, sound }, getProgressSnapshot()));
    setIndex(0);
    setStage("practice");
    setResult(null);
    setSessionScores([]);
  }, [topic, sound]);

  useEffect(() => () => stopSpeaking(), []);

  const title = sound ? `${SOUNDS[sound].label} sound drill` : topic ? getTopic(topic)?.name ?? "Practice" : "Daily practice";
  const phrase = queue?.[index];

  const next = useCallback(() => {
    stopSpeaking();
    setResult(null);
    if (!queue) return;
    if (index + 1 >= queue.length) {
      setStage("summary");
    } else {
      setIndex((i) => i + 1);
      setStage("practice");
    }
  }, [index, queue]);

  const handleResult = useCallback(
    (alts: string[]) => {
      if (!phrase) return;
      const r = scoreBest(phrase.text, alts);
      recordAttempt({ phraseId: phrase.id, score: r.score, words: r.words });
      setSessionScores((s) => [...s, r.score]);
      setResult(r);
      setStage("feedback");
    },
    [phrase],
  );

  return (
    <MobileShell nav={false}>
      <div className="flex items-center gap-3">
        <Button asChild variant="soft" size="icon-lg" aria-label="Close practice">
          <Link to="/">
            <X />
          </Link>
        </Button>
        <div className="flex-1">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{title}</p>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-hero transition-[width] duration-500"
              style={{ width: queue ? `${((stage === "summary" ? queue.length : index + (stage === "feedback" ? 1 : 0)) / queue.length) * 100}%` : "0%" }}
            />
          </div>
        </div>
        <span className="min-w-10 text-right text-sm font-extrabold text-muted-foreground">
          {queue ? `${Math.min(index + 1, queue.length)}/${queue.length}` : ""}
        </span>
      </div>

      {!queue || !phrase ? (
        <div className="mt-10 h-80 animate-pulse rounded-[2rem] bg-card/70" />
      ) : stage === "summary" ? (
        <Summary scores={sessionScores} />
      ) : stage === "feedback" && result ? (
        <Feedback
          key={`${phrase.id}-${sessionScores.length}`}
          phrase={phrase}
          result={result}
          onRetry={() => {
            setResult(null);
            setStage("practice");
          }}
          onContinue={next}
          isLast={index + 1 >= queue.length}
        />
      ) : (
        <PracticeCard
          key={phrase.id}
          phrase={phrase}
          language={progress.translationLanguage}
          onResult={handleResult}
          onNext={next}
        />
      )}
    </MobileShell>
  );
}

/* ---------------- Practice card ---------------- */

function PracticeCard({
  phrase,
  language,
  onResult,
  onNext,
}: {
  phrase: Phrase;
  language: string | null;
  onResult: (alts: string[]) => void;
  onNext: () => void;
}) {
  const recorder = useSpeechRecorder(onResult);
  const [slow, setSlow] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showTr, setShowTr] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const translation = usePhraseTranslation(phrase, language, showTr);

  // Swipe left to skip
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);
  const [leaving, setLeaving] = useState(false);

  const skip = () => {
    recorder.cancel();
    setLeaving(true);
    setTimeout(onNext, 220);
  };

  const listen = () => {
    if (!canSpeak()) return;
    setPlaying(true);
    speak(phrase.text, { slow, onEnd: () => setPlaying(false) });
  };

  const toggleTranslation = () => {
    if (!language) {
      setPickerOpen(true);
      return;
    }
    setShowTr((s) => !s);
  };

  const listening = recorder.status === "listening";

  return (
    <div className="mt-6 flex flex-col items-center">
      <div
        className={cn(
          "w-full touch-pan-y select-none rounded-[2rem] bg-card p-6 shadow-card transition-[transform,opacity] animate-pop-in",
          startX.current === null && "duration-300",
          leaving && "-translate-x-[120%] opacity-0",
        )}
        style={!leaving && dx ? { transform: `translateX(${dx}px) rotate(${dx / 30}deg)` } : undefined}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          startX.current = e.clientX;
        }}
        onPointerMove={(e) => {
          if (startX.current !== null) setDx(Math.min(0, e.clientX - startX.current));
        }}
        onPointerUp={() => {
          if (startX.current !== null && dx < -90) skip();
          startX.current = null;
          setDx(0);
        }}
        onPointerCancel={() => {
          startX.current = null;
          setDx(0);
        }}
      >
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-secondary-foreground">
            {getTopic(phrase.topic)?.name}
          </span>
          <button
            onClick={toggleTranslation}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors",
              showTr ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary-soft",
            )}
          >
            <Languages className="size-4" /> {showTr ? "Hide" : "Translate"}
          </button>
        </div>

        <p className="mt-6 font-display text-[1.9rem] font-semibold leading-tight">{phrase.text}</p>
        <p className="mt-3 text-lg text-muted-foreground">/{phrase.ipa}/</p>

        {showTr && language && (
          <div className="mt-4 rounded-2xl bg-primary-soft px-4 py-3 animate-rise">
            {translation.isLoading ? (
              <p className="animate-pulse text-sm font-semibold text-muted-foreground">Translating into {language}…</p>
            ) : translation.isError ? (
              <p className="text-sm font-semibold text-danger">{(translation.error as Error).message}</p>
            ) : (
              <p className="text-lg font-semibold">{translation.data || "—"}</p>
            )}
            <button className="mt-1 text-xs font-bold text-primary underline-offset-2 hover:underline" onClick={() => setPickerOpen(true)}>
              {language} · change
            </button>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <Button variant="mint" size="pill" className="flex-1" onClick={listen} disabled={listening}>
            <Volume2 className={cn(playing && "animate-wiggle")} /> {playing ? "Playing…" : "Listen"}
          </Button>
          <Button
            variant={slow ? "chip" : "soft"}
            size="pill"
            onClick={() => setSlow((s) => !s)}
            aria-pressed={slow}
            className={cn(slow && "ring-2 ring-accent")}
          >
            <Snail /> Slow
          </Button>
        </div>
      </div>

      <p className="mt-2 text-xs font-semibold text-muted-foreground">Swipe left or tap Next to skip</p>

      <div className="mt-5 w-full">
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
          <div className="flex min-h-20 flex-col items-center justify-center">
            <Waveform active={listening} analyser={recorder.analyser} speaking={recorder.speaking} />
            <p className={cn("mt-1 min-h-6 text-center text-base font-semibold", recorder.interim ? "text-foreground" : "text-muted-foreground")}>
              {recorder.interim ? `“${recorder.interim}”` : listening ? "Listening… say the phrase" : recorder.status === "requesting" ? "Getting the mic ready…" : "Tap the mic and read the phrase aloud"}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 grid w-full grid-cols-3 items-center">
        <span />
        <div className="flex justify-center">
          <MicButton status={recorder.status} onStart={() => void recorder.start()} onStop={recorder.stop} />
        </div>
        <div className="flex justify-end">
          <Button variant="soft" size="pill" onClick={skip} disabled={listening}>
            Next <SkipForward />
          </Button>
        </div>
      </div>

      <LanguagePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={language}
        onSelect={(l) => {
          setTranslationLanguage(l);
          setShowTr(true);
        }}
      />
    </div>
  );
}

/* ---------------- Feedback ---------------- */

const chipClass: Record<WordResult["status"], string> = {
  correct: "bg-success-soft text-success border-success/30",
  close: "bg-warning-soft text-warning border-warning/40",
  missed: "bg-danger-soft text-danger border-danger/30",
};

function Feedback({
  phrase,
  result,
  onRetry,
  onContinue,
  isLast,
}: {
  phrase: Phrase;
  result: ScoreResult;
  onRetry: () => void;
  onContinue: () => void;
  isLast: boolean;
}) {
  const words = displayWords(phrase.text);
  const ipas = ipaWords(phrase);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (shouldCelebrate(result.score)) {
      const t = setTimeout(() => void fireConfetti(), 700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [result.score]);

  const counts = {
    correct: result.words.filter((w) => w.status === "correct").length,
    close: result.words.filter((w) => w.status === "close").length,
    missed: result.words.filter((w) => w.status === "missed").length,
  };

  return (
    <div className="mt-6 flex flex-col items-center">
      <div className="relative w-full rounded-[2rem] bg-card p-6 pt-8 shadow-card animate-pop-in">
        <Mascot
          mood={result.score >= 75 ? "cheer" : "wave"}
          className="absolute right-2 top-2 w-20 animate-float"
        />
        <ScoreGauge score={result.score} />
        <div className="mt-2 flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-3 py-1 text-sm font-extrabold">
            <Zap className="size-4 fill-sun text-sun" /> +{xpForScore(result.score)} XP
          </span>
        </div>

        <p className="mt-6 text-center text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Tap a word for tips</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {words.map((w, i) => {
            const r = result.words[i];
            if (!r) return null;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={cn(
                  "rounded-2xl border-2 px-3 py-1.5 font-display text-xl font-semibold transition-transform hover:-translate-y-0.5 active:scale-95 animate-rise",
                  chipClass[r.status],
                )}
                style={{ animationDelay: `${300 + i * 60}ms` }}
              >
                {w}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center gap-4 text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-success" /> {counts.correct} correct</span>
          <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-warning" /> {counts.close} close</span>
          <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-danger" /> {counts.missed} missed</span>
        </div>

        <p className="mt-5 rounded-2xl bg-muted px-4 py-3 text-center text-sm">
          <span className="font-bold text-muted-foreground">We heard: </span>
          <span className="font-semibold">“{result.transcript || "…"}”</span>
        </p>
      </div>

      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <Button variant="soft" size="xl" onClick={onRetry}>
          <RotateCcw /> Try again
        </Button>
        <Button variant="hero" size="xl" onClick={onContinue}>
          {isLast ? "Finish" : "Continue"} <ArrowRight />
        </Button>
      </div>

      <WordDetail
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
        word={selected !== null ? result.words[selected] ?? null : null}
        display={selected !== null ? words[selected] ?? "" : ""}
        ipa={selected !== null ? ipas[selected] ?? "" : ""}
      />
    </div>
  );
}

/* ---------------- Summary ---------------- */

function Summary({ scores }: { scores: number[] }) {
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const xp = scores.reduce((s, x) => s + xpForScore(x), 0);
  useEffect(() => {
    if (scores.length) void fireConfetti();
  }, [scores.length]);
  return (
    <div className="mt-8 flex flex-col items-center text-center animate-pop-in">
      <Mascot mood="cheer" eager className="w-48 animate-float" />
      <h1 className="mt-2 font-display text-3xl font-bold">Session complete!</h1>
      <p className="mt-1 text-muted-foreground">
        {scores.length ? "Every phrase brings you closer to sounding natural." : "You skipped this round — try speaking next time!"}
      </p>
      <div className="mt-6 grid w-full grid-cols-3 gap-3">
        <Stat label="Phrases" value={String(scores.length)} />
        <Stat label="Avg score" value={scores.length ? String(avg) : "–"} tone={scores.length ? scoreTone(avg) : undefined} />
        <Stat label="XP earned" value={`+${xp}`} />
      </div>
      <div className="mt-8 grid w-full grid-cols-2 gap-3">
        <Button asChild variant="soft" size="xl">
          <Link to="/">
            <Home /> Home
          </Link>
        </Button>
        <Button asChild variant="hero" size="xl">
          <Link to="/progress">
            <Trophy /> Progress
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string | undefined }) {
  return (
    <div className="rounded-3xl bg-card p-4 shadow-card">
      <p className={cn("font-display text-3xl font-bold", tone)}>{value}</p>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
    </div>
  );
}
