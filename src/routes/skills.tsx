import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, AudioLines, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { PracticeTools } from "@/components/speakup/PracticeTools";
import { TopicCard } from "@/components/speakup/TopicCard";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/use-progress";
import {
  LEARNING_GOALS,
  loadLearningGoals,
  saveLearningGoals,
  type LearningGoal,
} from "@/lib/learning-plan";
import { PHRASES } from "@/lib/phrases";
import { masteredIds, soundAverage } from "@/lib/progress";
import { SOUND_IDS, SOUNDS } from "@/lib/sounds";
import { DIFFICULTIES, isDifficulty, TOPICS, type Difficulty } from "@/lib/topics";
import { cn } from "@/lib/utils";

interface LibrarySearch {
  level?: Difficulty | undefined;
}

export const Route = createFileRoute("/skills")({
  validateSearch: (search: Record<string, unknown>): LibrarySearch => ({
    level: isDifficulty(search["level"]) ? search["level"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Practice Library — Speak Sprout" },
      {
        name: "description",
        content: "Browse English practice by topic or difficulty, or focus on a specific sound.",
      },
    ],
  }),
  component: Library,
});

function Library() {
  const { level } = Route.useSearch();
  const progress = useProgress();
  const mastered = new Set(masteredIds(progress));
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  useEffect(() => setGoals(loadLearningGoals()), []);

  const phrases = level ? PHRASES.filter((phrase) => phrase.difficulty === level) : PHRASES;

  function toggleGoal(goal: LearningGoal) {
    const next = goals.includes(goal) ? goals.filter((item) => item !== goal) : [...goals, goal];
    setGoals(next);
    saveLearningGoals(next);
  }

  return (
    <MobileShell>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Practice library</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose a topic, a level, or a sound to focus on.
      </p>

      <section className="mt-6 rounded-[1.5rem] border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold">Phrase topics</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {phrases.length} phrases available
            </p>
          </div>
          {level && (
            <Button asChild variant="hero" className="rounded-full px-4">
              <Link to="/practice" search={{ level }}>
                Practice {level.toLowerCase()} <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
        <nav aria-label="Filter topics by level" className="mt-4 flex flex-wrap gap-1.5">
          {[undefined, ...DIFFICULTIES].map((difficulty) => (
            <Link
              key={difficulty ?? "all"}
              to="/skills"
              search={{ level: difficulty }}
              replace
              aria-current={level === difficulty ? "true" : undefined}
              className={cn(
                "rounded-full border px-3 py-2 text-xs font-extrabold transition-colors hover:border-primary/40",
                level === difficulty
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground",
              )}
            >
              {difficulty ?? "All levels"}
            </Link>
          ))}
        </nav>
        <div className="mt-4 grid gap-2.5 md:grid-cols-2">
          {TOPICS.map((topic) => {
            const available = phrases.filter((phrase) => phrase.topic === topic.id);
            if (!available.length) return null;
            return (
              <TopicCard
                key={topic.id}
                topic={topic}
                level={level}
                total={available.length}
                done={available.filter((phrase) => mastered.has(phrase.id)).length}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-border bg-card p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
          <AudioLines aria-hidden="true" className="size-5 text-primary" /> Sound drills
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Match scores reflect words with the target sound.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SOUND_IDS.map((id) => {
            const sound = SOUNDS[id];
            const score = soundAverage(progress.sounds[id]);
            return (
              <Link
                key={id}
                to="/practice"
                search={{ sound: id }}
                className="rounded-2xl border border-border p-3 transition-colors hover:border-primary/35 hover:bg-primary-soft"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-1">
                  <h3 className="font-display text-lg font-semibold text-primary">{sound.label}</h3>
                  {score !== null && (
                    <span className="text-xs font-bold text-muted-foreground">{score}% match</span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {sound.ipa} · {sound.example}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-border bg-card p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
          <Target aria-hidden="true" className="size-5 text-primary" /> Learning goals
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Daily practice gives priority to the topics you select here.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {LEARNING_GOALS.map((goal) => (
            <Button
              key={goal}
              variant={goals.includes(goal) ? "hero" : "soft"}
              className="rounded-full px-3"
              aria-pressed={goals.includes(goal)}
              onClick={() => toggleGoal(goal)}
            >
              {goal}
            </Button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-display text-2xl font-semibold">Practice tools</h2>
        <PracticeTools />
      </section>
    </MobileShell>
  );
}
