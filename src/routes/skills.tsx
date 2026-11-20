import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { PracticeTools } from "@/components/speakup/PracticeTools";
import { SoundChart } from "@/components/speakup/SoundChart";
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
import { masteredIds } from "@/lib/progress";
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
      { title: "Sound Lab & Library — SayTempo" },
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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-primary">Practice Hub</p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
            Sound Lab &amp; Library
          </h1>
        </div>
        <a
          href="#phrase-library"
          className="inline-flex items-center gap-1 rounded-md text-sm font-bold text-primary"
        >
          Phrase library <ArrowDown aria-hidden="true" className="size-4" />
        </a>
      </header>

      <div className="mt-5">
        <SoundChart />
      </div>
      <section className="mt-6" aria-label="Practice tools">
        <PracticeTools />
      </section>

      <section
        id="phrase-library"
        className="mt-6 scroll-mt-20 clay-card rounded-3xl bg-card p-4 sm:p-6"
      >
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

      <section className="mt-6 clay-card rounded-3xl bg-card p-4 sm:p-6">
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
    </MobileShell>
  );
}
