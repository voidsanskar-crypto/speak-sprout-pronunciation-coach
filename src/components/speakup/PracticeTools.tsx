import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  Headphones,
  MessageCircle,
  NotebookPen,
  Target,
} from "lucide-react";

const activities = [
  {
    to: "/review",
    label: "Personal Review Deck",
    detail: "Review words you struggled with",
    Icon: CalendarClock,
  },
  {
    to: "/minimal-pairs",
    label: "Minimal pairs",
    detail: "Hear and practice similar sounds",
    Icon: Headphones,
  },
  {
    to: "/dialogue",
    label: "Roleplay",
    detail: "Rehearse a real conversation",
    Icon: MessageCircle,
  },
  {
    to: "/custom",
    label: "Your own text",
    detail: "Practice a phrase or script",
    Icon: NotebookPen,
  },
  {
    to: "/dictionary",
    label: "Dictionary",
    detail: "Look up words and hear examples",
    Icon: BookOpen,
  },
  {
    to: "/assessment",
    label: "Speaking check",
    detail: "Find a starting practice level",
    Icon: Target,
  },
] as const;

export function PracticeTools() {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
      {activities.map(({ to, label, detail, Icon }) => (
        <Link
          key={to}
          to={to}
          className="group relative rounded-2xl border border-border bg-card p-3.5 transition-colors hover:border-primary/35 hover:bg-primary-soft sm:p-4"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-secondary text-secondary-foreground">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          <ArrowUpRight
            aria-hidden="true"
            className="absolute right-3.5 top-3.5 size-4 text-muted-foreground group-hover:text-primary"
          />
          <h3 className="mt-3 font-display text-base font-semibold leading-tight">{label}</h3>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{detail}</p>
        </Link>
      ))}
    </div>
  );
}
