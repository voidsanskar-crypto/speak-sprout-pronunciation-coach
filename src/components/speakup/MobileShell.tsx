import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3, Home, LibraryBig, Mic, Sprout, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const destinations = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/practice", label: "Practice", Icon: Mic },
  { to: "/skills", label: "Library", Icon: LibraryBig },
  { to: "/progress", label: "Progress", Icon: BarChart3 },
] as const;

export function MobileShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  if (!nav) {
    return <main className="mx-auto min-h-dvh max-w-xl px-4 pb-10 pt-6 sm:px-6">{children}</main>;
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
        <ProfileLink className="mt-auto" />
      </aside>
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 pb-1 pt-5 sm:px-6 lg:hidden">
        <Brand />
        <ProfileLink compact />
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-w-0 max-w-2xl px-4 pb-28 pt-5 outline-none sm:px-6 lg:mx-0 lg:max-w-none lg:px-10 lg:pb-12 lg:pt-10"
      >
        {children}
      </main>
      <Navigation className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-2xl grid-cols-4 gap-1 rounded-t-3xl border border-border bg-card/95 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)] shadow-card backdrop-blur-lg lg:hidden" />
    </div>
  );
}

function Brand() {
  return (
    <Link
      to="/"
      className="inline-flex w-fit items-center gap-2.5 rounded-xl font-display text-xl font-bold text-primary outline-offset-4"
    >
      <span className="grid size-10 place-items-center rounded-[0.85rem] bg-primary text-primary-foreground">
        <Sprout aria-hidden="true" className="size-5" />
      </span>
      Speak Sprout
    </Link>
  );
}

function ProfileLink({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      to="/login"
      aria-label="Local profile"
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-sm font-bold text-foreground transition-colors hover:bg-primary-soft",
        className,
      )}
    >
      <UserRound aria-hidden="true" className="size-5 text-primary" />
      {!compact && "Profile"}
    </Link>
  );
}

function Navigation({ className }: { className: string }) {
  return (
    <nav aria-label="Main navigation" className={className}>
      {destinations.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: true, includeSearch: false }}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-bold text-muted-foreground transition-colors hover:bg-muted data-[status=active]:bg-primary-soft data-[status=active]:text-primary lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm"
        >
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
