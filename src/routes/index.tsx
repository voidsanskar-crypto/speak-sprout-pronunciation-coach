import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, MessageCircle, Play, Sparkles, Zap } from "lucide-react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Mascot } from "@/components/speakup/Mascot";
import { Ring } from "@/components/speakup/Ring";
import { TopicCard } from "@/components/speakup/TopicCard";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/use-progress";
import { useHydrated } from "@/hooks/use-hydrated";
import { PHRASES } from "@/lib/phrases";
import { currentStreak, DAILY_GOAL, masteredIds, phrasesDoneOn, toDateKey } from "@/lib/progress";
import { SOUND_IDS, SOUNDS } from "@/lib/sounds";
import { TOPICS } from "@/lib/topics";
import { loadAssessment } from "@/lib/assessment";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SpeakUp — Your daily English pronunciation coach" },
      {
        name: "description",
        content:
          "Build a daily streak, practice real phrases and get instant feedback on every word you say.",
      },
      { property: "og:title", content: "SpeakUp — Your daily English pronunciation coach" },
      {
        property: "og:description",
        content:
          "Build a daily streak, practice real phrases and get instant feedback on every word you say.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Home() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const today = hydrated ? toDateKey(new Date()) : "";
  const done = hydrated ? phrasesDoneOn(progress, today) : 0;
  const streak = hydrated ? currentStreak(progress, today) : 0;
  const mastered = new Set(masteredIds(progress));
  const assessment = hydrated ? loadAssessment() : null;
  const left = Math.max(0, DAILY_GOAL - done);

  return (
    <MobileShell>
      <header className="flex items-start justify-between animate-rise">
        <div className="pt-2">
          <p className="text-sm font-bold text-muted-foreground">
            {hydrated ? greeting(new Date().getHours()) : "Hello"} 👋
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight">
            Ready to <span className="text-primary">SpeakUp</span>?
          </h1>
          <div className="mt-3 flex gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-extrabold shadow-soft">
              <Flame className="size-4 fill-flame text-flame animate-flicker" /> {streak} day
              {streak === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-extrabold shadow-soft">
              <Zap className="size-4 fill-sun text-sun" /> {progress.xp} XP
            </span>
          </div>
        </div>
        <Mascot eager className="-mr-2 -mt-2 w-32 animate-float" />
      </header>

      <section className="mt-5 flex items-center gap-5 rounded-[2rem] bg-card p-5 shadow-card animate-rise [animation-delay:80ms]">
        <Ring
          value={done / DAILY_GOAL}
          size={104}
          stroke={11}
          barClassName="text-primary"
          trackClassName="text-primary-soft"
        >
          <span className="font-display text-3xl font-bold leading-none">{done}</span>
          <span className="text-[11px] font-bold text-muted-foreground">of {DAILY_GOAL}</span>
        </Ring>
        <div className="flex-1">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Today's goal
          </p>
          <p className="mt-1 font-display text-xl font-semibold leading-snug">
            {left === 0 ? "Goal smashed! 🎉" : `${left} phrase${left === 1 ? "" : "s"} to go`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {left === 0
              ? "Keep going for bonus XP."
              : "A few minutes a day builds a native-like accent."}
          </p>
        </div>
      </section>

      <Button
        asChild
        variant="hero"
        size="xl"
        className="mt-5 w-full animate-rise [animation-delay:140ms]"
      >
        <Link to="/practice">
          <Play className="fill-current" /> Start Daily Practice
        </Link>
      </Button>

      <section className="mt-4 rounded-[2rem] bg-card p-5 shadow-card">
        {assessment ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  Your level
                </p>
                <p className="mt-1 font-display text-xl font-bold">
                  {assessment.level} · {assessment.score}%
                </p>
              </div>
              <Button asChild variant="soft" size="sm">
                <Link to="/assessment">Retake</Link>
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Daily practice is tuned to your{" "}
              {assessment.weakSounds.length
                ? `${assessment.weakSounds.join(" and ")} sound goals`
                : "balanced pronunciation"}
              .
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-lg font-bold">Find your English level</p>
            <p className="mt-1 text-sm text-muted-foreground">
              A quick 5-phrase check builds a personalized daily plan.
            </p>
            <Button asChild variant="soft" className="mt-3 w-full">
              <Link to="/assessment">
                Start pronunciation check <Play />
              </Link>
            </Button>
          </>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild variant="chip" size="pill">
            <Link to="/dialogue">
              <MessageCircle /> Roleplay
            </Link>
          </Button>
          <Button asChild variant="chip" size="pill">
            <Link to="/custom">
              <Sparkles /> Your own text
            </Link>
          </Button>
          <Button asChild variant="chip" size="pill">
            <Link to="/skills">Skills</Link>
          </Button>
          <Button asChild variant="chip" size="pill">
            <Link to="/dictionary">Dictionary</Link>
          </Button>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">Topics</h2>
          <span className="text-xs font-bold text-muted-foreground">
            {mastered.size} / {PHRASES.length} mastered
          </span>
        </div>
        <div className="space-y-3">
          {TOPICS.map((t, i) => {
            const ids = PHRASES.filter((p) => p.topic === t.id).map((p) => p.id);
            return (
              <TopicCard
                key={t.id}
                topic={t}
                total={ids.length}
                done={ids.filter((id) => mastered.has(id)).length}
                delay={200 + i * 60}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold">
          <Sparkles className="size-5 text-primary" /> Quick sound drills
        </h2>
        <div className="flex flex-wrap gap-2">
          {SOUND_IDS.map((s) => (
            <Button key={s} asChild variant="chip" size="pill">
              <Link to="/practice" search={{ sound: s }}>
                <span className="font-display">{SOUNDS[s].label}</span>
                <span className="text-xs font-semibold opacity-70">{SOUNDS[s].example}</span>
              </Link>
            </Button>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}
