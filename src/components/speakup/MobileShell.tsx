import { Mascot } from "./Mascot";
import { KikiGuide } from "./KikiGuide";
import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarClock,
  Flame,
  Gamepad2,
  Home,
  LibraryBig,
  Sprout,
  UserRound,
  Zap,
  Headphones,
} from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useProgress } from "@/hooks/use-progress";
import { currentStreak, DAILY_GOAL, phrasesDoneOn, toDateKey } from "@/lib/progress";
import { useLocalProfile } from "@/hooks/use-local-profile";
import { cn } from "@/lib/utils";

const destinations = [
  { to: "/", label: "Today", Icon: Home, routes: ["/daily-session"] },
  {
    to: "/skills",
    label: "Practice Hub",
    Icon: LibraryBig,
    routes: ["/accent-x-ray", "/dictionary", "/practice", "/custom", "/assessment"],
  },
  {
    to: "/arcade",
    label: "Arcade",
    Icon: Gamepad2,
    routes: ["/mission", "/minimal-pairs"],
  },
  { to: "/progress", label: "Progress", Icon: BarChart3, routes: [] },
] as const;

const desktopGroups = [
  { label: "Train", links: [destinations[0], destinations[1]] },
  {
    label: "Play",
    links: [
      destinations[2],
      { to: "/ear-sprint", label: "Ear Sprint", Icon: Headphones, routes: [] },
    ],
  },
  {
    label: "Stats",
    links: [
      destinations[3],
      { to: "/review", label: "Review Deck", Icon: CalendarClock, routes: [] },
    ],
  },
] as const;

type Destination = (typeof desktopGroups)[number]["links"][number];

export function MobileShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  if (!nav) {
    return (
      <div className="mx-auto min-h-dvh max-w-xl">
        <TopBar />
        <main className="px-4 pb-28 pt-5 sm:px-6">{children}</main>
        <KikiGuide />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-7xl lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:px-6">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-xl bg-card p-3 focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto border-r border-border py-5 pr-5 lg:flex">
        <Brand />
        <Navigation desktop className="mt-5 grid gap-4" />
        <SidebarGoal />
      </aside>
      <div className="min-w-0">
        <TopBar full />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto min-w-0 max-w-2xl px-4 pb-40 pt-5 outline-none sm:px-6 lg:mx-0 lg:max-w-none lg:px-10 lg:pb-32 lg:pt-5"
        >
          {children}
        </main>
      </div>
      <KikiGuide aboveNavigation />
      <Navigation className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-2xl grid-cols-4 gap-1 rounded-t-3xl clay-card bg-card/95 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)] shadow-card backdrop-blur-lg lg:hidden" />
    </div>
  );
}

function TopBar({ full = false }: { full?: boolean }) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const streak = hydrated ? currentStreak(progress, toDateKey(new Date())) : 0;
  const xp = hydrated ? progress.xp : 0;
  return (
    <header
      className={cn(
        "sticky top-0 z-30 mx-auto flex items-center justify-between gap-2 border-b border-border/70 bg-background/95 px-4 py-2.5 backdrop-blur-lg sm:px-6",
        full && "max-w-2xl lg:max-w-none lg:justify-end lg:px-10",
      )}
    >
      <div className={full ? "lg:hidden" : undefined}>
        <Brand compact />
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Link
          to="/progress"
          aria-label={`Progress: ${streak}-day streak, ${xp} XP`}
          className="group flex items-center gap-1.5 rounded-xl text-xs font-extrabold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:gap-2"
        >
          <span className="tactile-btn tactile-sun gem-gauge inline-flex min-h-8 items-center gap-1 rounded-xl px-2 group-active:translate-y-1 group-active:shadow-none">
            <Flame aria-hidden="true" className="size-4 fill-current" />
            {streak}
          </span>
          <span className="tactile-btn tactile-violet gem-gauge inline-flex min-h-8 items-center gap-1 rounded-xl px-2 group-active:translate-y-1 group-active:shadow-none">
            <Zap aria-hidden="true" className="size-4 fill-current" />
            {xp} XP
          </span>
        </Link>
        <ProfileLink />
      </div>
    </header>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex w-fit items-center rounded-xl font-display font-bold text-primary outline-offset-4",
        compact ? "gap-1.5 text-sm sm:gap-2 sm:text-lg" : "gap-2.5 text-xl",
      )}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-[0.85rem] bg-primary text-primary-foreground",
          compact ? "size-8 sm:size-9" : "size-10",
        )}
      >
        <Sprout aria-hidden="true" className="size-5" />
      </span>
      SayTempo
    </Link>
  );
}

function ProfileLink() {
  const profile = useLocalProfile();
  const name = profile?.name;
  const initial = name ? firstGrapheme(name).toLocaleUpperCase() : "";
  return (
    <Link
      to="/login"
      aria-label={name ? `Local profile for ${name}` : "Local profile"}
      className="tactile-btn tactile-neutral grid min-h-9 min-w-9 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-primary-soft"
    >
      {initial ? (
        <span
          aria-hidden="true"
          className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[0.65rem] font-extrabold text-primary-foreground"
        >
          {initial}
        </span>
      ) : (
        <UserRound aria-hidden="true" className="size-5 shrink-0 text-primary" />
      )}
    </Link>
  );
}

function firstGrapheme(name: string) {
  if (typeof Intl.Segmenter === "function") {
    return new Intl.Segmenter().segment(name)[Symbol.iterator]().next().value?.segment ?? "";
  }
  return Array.from(name)[0] ?? "";
}

function SidebarGoal() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const count = hydrated ? phrasesDoneOn(progress, toDateKey(new Date())) : 0;
  const reached = count >= DAILY_GOAL;

  return (
    <section aria-labelledby="sidebar-goal" className="mt-auto pt-5">
      <div className="clay-card rounded-2xl bg-primary-soft p-3">
        <h2 id="sidebar-goal" className="font-display text-sm font-semibold">
          Daily speaking goal
        </h2>
        <p className="mt-1 text-xs font-bold text-muted-foreground">
          {count} / {DAILY_GOAL} phrases spoken today
        </p>
        <progress
          aria-labelledby="sidebar-goal"
          value={Math.min(count, DAILY_GOAL)}
          max={DAILY_GOAL}
          className="goal-meter mt-2"
        />
        <div className="mt-1 flex items-center gap-1.5">
          <Mascot
            mood={reached ? "cheer" : "wave"}
            sizes="48px"
            className={cn("size-12 shrink-0", reached && "kiki-cheer")}
          />
          <p className="text-xs font-bold">
            {reached ? "Goal reached!" : count ? "Keep it up!" : "Ready to speak?"}
          </p>
        </div>
      </div>
    </section>
  );
}

function Navigation({ className, desktop = false }: { className: string; desktop?: boolean }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  function renderLink({ to, label, Icon, routes }: Destination) {
    const mobileChild =
      !desktop &&
      ((to === "/" && pathname === "/review") || (to === "/arcade" && pathname === "/ear-sprint"));
    return (
      <Link
        key={to}
        to={to}
        activeOptions={{ exact: true, includeSearch: false }}
        data-section-active={mobileChild || routes.some((route) => pathname === route) || undefined}
        className="shell-tab flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-center text-[11px] font-bold text-muted-foreground hover:bg-muted lg:min-h-10 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm"
      >
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <nav aria-label="Main navigation" className={className}>
      {desktop
        ? desktopGroups.map(({ label, links }) => (
            <div key={label} role="group" aria-label={label} className="grid gap-1">
              <p
                aria-hidden="true"
                className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground"
              >
                {label}
              </p>
              {links.map(renderLink)}
            </div>
          ))
        : destinations.map(renderLink)}
    </nav>
  );
}
