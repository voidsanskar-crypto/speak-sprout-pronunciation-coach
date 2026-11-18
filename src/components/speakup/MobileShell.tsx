import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3, Home, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className={cn("flex-1 px-5 pt-6", nav ? "pb-28" : "pb-8")}>{children}</main>
      {nav && <BottomNav />}
    </div>
  );
}

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/practice", label: "Practice", icon: Mic },
  { to: "/progress", label: "Progress", icon: BarChart3 },
] as const;

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-[max(env(safe-area-inset-bottom),12px)]">
      <div className="flex items-center justify-around rounded-full border border-border bg-card/90 p-2 shadow-card backdrop-blur-md">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true, includeSearch: false }}
            className="group flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-xs font-bold text-muted-foreground transition-colors data-[status=active]:text-primary"
          >
            <span className="flex h-8 w-12 items-center justify-center rounded-full transition-colors group-data-[status=active]:bg-primary-soft">
              <Icon className="size-5" />
            </span>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
