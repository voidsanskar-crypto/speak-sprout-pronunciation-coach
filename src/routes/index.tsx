import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Backpack, Flame, Mic, Sprout, Zap } from "lucide-react";
import { Mascot } from "@/components/speakup/Mascot";
import { MobileShell } from "@/components/speakup/MobileShell";
import { PracticeTools } from "@/components/speakup/PracticeTools";
import { Ring } from "@/components/speakup/Ring";
import { TopicCard } from "@/components/speakup/TopicCard";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { useProgress } from "@/hooks/use-progress";
import { loadAssessment } from "@/lib/assessment";
import { PHRASES, phrasesForTopic } from "@/lib/phrases";
import { currentStreak, DAILY_GOAL, masteredIds, phrasesDoneOn, toDateKey } from "@/lib/progress";
import { SOUNDS, SOUND_IDS } from "@/lib/sounds";
import { TOPICS } from "@/lib/topics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Speak Sprout — English Speaking Practice" },
      {
        name: "description",
        content:
          "Practice English one phrase at a time with audio examples, voice replay, and word-match feedback.",
      },
      { property: "og:title", content: "Speak Sprout — English Speaking Practice" },
      {
        property: "og:description",
        content:
          "Practice English one phrase at a time with audio examples, voice replay, and word-match feedback.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const today = hydrated ? toDateKey(new Date()) : "";
  const done = hydrated ? phrasesDoneOn(progress, today) : 0;
  const streak = hydrated ? currentStreak(progress, today) : 0;
  const assessment = hydrated ? loadAssessment() : null;
  const mastered = new Set(masteredIds(progress));
  const goalReached = done >= DAILY_GOAL;

  return (
    <MobileShell>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <section className="relative isolate min-h-60 overflow-hidden rounded-[1.75rem] border border-primary/15 bg-primary-soft p-5 sm:p-7">
          <div
            aria-hidden="true"
            className="absolute -right-12 -top-16 -z-10 size-72 rounded-full bg-secondary sm:size-88"
          />
          <Mascot
            eager
            className="absolute -bottom-4 -right-5 -z-10 w-33 min-[375px]:right-0 min-[375px]:w-38 sm:-bottom-7 sm:right-0 sm:w-48 xl:right-2 xl:w-53"
          />
          <div className="max-w-[15rem] sm:max-w-68">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-primary">
              <Sprout aria-hidden="true" className="size-4" />
              {assessment ? `${assessment.level} practice plan` : "Your daily session"}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-[1.05] sm:text-4xl">
              Daily speaking practice
            </h1>
            <p className="mt-3 max-w-44 text-sm leading-relaxed text-muted-foreground sm:max-w-60">
              Hear each phrase, record your version, and review what the browser heard.
            </p>
            <Button
              asChild
              variant="hero"
              size="pill"
              className="mt-5 px-4 text-sm sm:px-6 sm:text-base"
            >
              <Link to="/practice">
                <Mic aria-hidden="true" /> Start practice
              </Link>
            </Button>
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-[1.75rem] border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Today’s goal</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {goalReached
                  ? "Daily goal reached"
                  : `${DAILY_GOAL - done} ${DAILY_GOAL - done === 1 ? "phrase" : "phrases"} to go`}
              </p>
            </div>
            <div aria-label={`${done} of ${DAILY_GOAL} phrases practiced`}>
              <Ring
                value={Math.min(1, done / DAILY_GOAL)}
                size={66}
                stroke={7}
                barClassName="text-primary"
                trackClassName="text-primary-soft"
              >
                <span className="font-display text-lg font-bold">
                  {done}/{DAILY_GOAL}
                </span>
              </Ring>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-sm font-bold">
            <span className="flex items-center gap-2">
              <Flame aria-hidden="true" className="size-4 text-flame" /> {streak}-day streak
            </span>
            <span className="flex items-center gap-2">
              <Zap aria-hidden="true" className="size-4 text-primary" /> {progress.xp} XP
            </span>
          </div>
        </section>
      </div>

      <section className="mt-7 flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-primary/20 bg-primary-soft p-4 sm:p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card text-primary">
          <Backpack aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold">Pack for the train</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Tell Kiki where to pack each item and watch what she does.
          </p>
        </div>
        <Button asChild variant="hero" className="w-full rounded-xl sm:w-auto">
          <Link to="/mission">
            Try the speaking mission <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>

      <section className="mt-7">
        <h2 className="mb-3 font-display text-2xl font-semibold">Practice tools</h2>
        <PracticeTools />
      </section>

      <section className="mt-7 rounded-[1.5rem] border border-border bg-card p-4 sm:p-5">
        <h2 className="font-display text-xl font-semibold">Quick sound drills</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SOUND_IDS.map((id) => (
            <Link
              key={id}
              to="/practice"
              search={{ sound: id }}
              className="rounded-xl border border-border px-2.5 py-2 transition-colors hover:border-primary/40 hover:bg-primary-soft"
            >
              <span className="block font-display text-base font-semibold text-primary">
                {SOUNDS[id].label}
              </span>
              <span className="block text-xs leading-snug text-muted-foreground">
                {SOUNDS[id].example}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-semibold">Phrase topics</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {mastered.size} of {PHRASES.length} mastered
            </p>
          </div>
          <Link
            to="/skills"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-bold text-primary underline-offset-4 hover:underline"
          >
            Open library <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <div className="grid gap-2.5 md:grid-cols-2">
          {TOPICS.map((topic) => {
            const phrases = phrasesForTopic(topic.id);
            return (
              <TopicCard
                key={topic.id}
                topic={topic}
                total={phrases.length}
                done={phrases.filter((phrase) => mastered.has(phrase.id)).length}
              />
            );
          })}
        </div>
      </section>
    </MobileShell>
  );
}
