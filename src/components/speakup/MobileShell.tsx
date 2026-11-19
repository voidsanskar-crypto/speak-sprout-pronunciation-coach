import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { BarChart3, Flame, Gamepad2, Home, LibraryBig, Sprout, UserRound, Zap } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useProgress } from "@/hooks/use-progress";
import { currentStreak, toDateKey } from "@/lib/progress";
import { useLocalProfile } from "@/hooks/use-local-profile";
import { cn } from "@/lib/utils";

const destinations = [
  { to: "/", label: "Today", Icon: Home, routes: ["/review"] },
  {
    to: "/skills",
    label: "Practice Hub",
    Icon: LibraryBig,
    routes: ["/accent-x-ray", "/dictionary"],
  },
  {
    to: "/arcade",
    label: "Arcade",
    Icon: Gamepad2,
    routes: ["/mission", "/minimal-pairs", "/ear-sprint"],
  },
  { to: "/progress", label: "Progress", Icon: BarChart3, routes: [] },
] as const;

export function MobileShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  if (!nav) {
    return (
      <div className="mx-auto min-h-dvh max-w-xl">
        <TopBar />
        <main className="px-4 pb-10 pt-5 sm:px-6">{children}</main>
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
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border py-8 pr-5 lg:flex">
        <Brand />
        <Navigation className="mt-12 grid gap-1.5" />
      </aside>
      <div className="min-w-0">
        <TopBar full />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto min-w-0 max-w-2xl px-4 pb-28 pt-5 outline-none sm:px-6 lg:mx-0 lg:max-w-none lg:px-10 lg:pb-12 lg:pt-5"
        >
          {children}
        </main>
      </div>
      <Navigation className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-2xl grid-cols-4 gap-1 rounded-t-3xl border border-border bg-card/95 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)] shadow-card backdrop-blur-lg lg:hidden" />
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
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs font-extrabold tabular-nums hover:bg-primary-soft sm:gap-2"
        >
          <Flame aria-hidden="true" className="size-3.5 text-flame" />
          <span>
            {streak}
            <span className="sr-only">-day streak</span>
          </span>
          <span aria-hidden="true" className="h-3 w-px bg-border" />
          <Zap aria-hidden="true" className="size-3.5 fill-sun text-flame" />
          <span>{xp} XP</span>
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
      Speak Sprout
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
      className="grid min-h-9 min-w-9 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-primary-soft"
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

function Navigation({ className }: { className: string }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  return (
    <nav aria-label="Main navigation" className={className}>
      {destinations.map(({ to, label, Icon, routes }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: true, includeSearch: false }}
          data-section-active={routes.some((route) => pathname === route) || undefined}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-center text-[11px] font-bold text-muted-foreground transition-colors hover:bg-muted data-[status=active]:bg-primary-soft data-[status=active]:text-primary data-[section-active=true]:bg-primary-soft data-[section-active=true]:text-primary lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm"
        >
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
