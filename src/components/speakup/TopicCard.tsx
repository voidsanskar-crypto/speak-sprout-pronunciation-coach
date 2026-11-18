import { Link } from "@tanstack/react-router";
import { AudioLines, Briefcase, ChevronRight, MessagesSquare, Plane } from "lucide-react";
import type { Topic, TopicId } from "@/lib/topics";
import { cn } from "@/lib/utils";

const icons: Record<TopicId, typeof Plane> = {
  travel: Plane,
  interview: Briefcase,
  smalltalk: MessagesSquare,
  sounds: AudioLines,
};

const badge = {
  Beginner: "bg-success-soft text-success",
  Intermediate: "bg-warning-soft text-warning",
  Advanced: "bg-danger-soft text-danger",
} as const;

export function TopicCard({ topic, done, total, delay = 0 }: { topic: Topic; done: number; total: number; delay?: number }) {
  const Icon = icons[topic.id];
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <Link
      to="/practice"
      search={{ topic: topic.id }}
      className="group flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5 active:scale-[0.98] animate-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-primary-foreground shadow-soft", topic.gradientClass)}>
        <Icon className="size-7" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-lg font-semibold">{topic.name}</h3>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide", badge[topic.difficulty])}>
            {topic.difficulty}
          </span>
        </div>
        <p className="truncate text-sm text-muted-foreground">{topic.blurb}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full transition-[width] duration-700", topic.gradientClass)} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            {done}/{total}
          </span>
        </div>
      </div>
      <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
