import { Link } from "@tanstack/react-router";
import { AudioLines, Briefcase, ChevronRight, MessagesSquare, Plane } from "lucide-react";
import type { Difficulty, Topic, TopicId } from "@/lib/topics";
import { cn } from "@/lib/utils";

const icons: Record<TopicId, typeof Plane> = {
  travel: Plane,
  interview: Briefcase,
  smalltalk: MessagesSquare,
  sounds: AudioLines,
};

export function TopicCard({
  topic,
  done,
  total,
  level,
}: {
  topic: Topic;
  done: number;
  total: number;
  level?: Difficulty | undefined;
}) {
  const Icon = icons[topic.id];
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <Link
      to="/practice"
      search={{ topic: topic.id, level }}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:border-primary/35 hover:bg-primary-soft sm:p-4"
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-950",
          topic.gradientClass,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg font-semibold leading-tight">{topic.name}</h3>
        <p className="truncate text-sm text-muted-foreground">{topic.blurb}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-700",
                topic.gradientClass,
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold whitespace-nowrap text-muted-foreground">
            {done}/{total}
          </span>
        </div>
      </div>
      <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
