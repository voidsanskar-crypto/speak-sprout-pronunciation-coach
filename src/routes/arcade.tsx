import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Backpack,
  Coffee,
  Gamepad2,
  Headphones,
  MessageCircle,
  TrainFront,
  Zap,
} from "lucide-react";
import { MobileShell } from "@/components/speakup/MobileShell";

export const Route = createFileRoute("/arcade")({
  head: () => ({ meta: [{ title: "Arcade — SayTempo" }] }),
  component: Arcade,
});

const games = [
  {
    to: "/ear-sprint",
    title: "Ear Sprint",
    text: "Pick the word you hear. Build an XP combo in 60 seconds.",
    Icon: Zap,
    tone: "bg-gradient-sunset",
    badge: "60s",
  },
  {
    to: "/minimal-pairs",
    title: "Minimal Pairs",
    text: "Hear the difference, then practice both words aloud.",
    Icon: Headphones,
    tone: "bg-gradient-violet",
    badge: "Ear + voice",
  },
  {
    to: "/dialogue",
    title: "AI Roleplay",
    text: "Rehearse a real conversation and practice your replies.",
    Icon: MessageCircle,
    tone: "bg-gradient-hero",
    badge: "AI",
  },
] as const;

const missions = [
  { title: "Pack for the train", text: "Tell Kiki what goes in each pocket.", Icon: Backpack, tone: "bg-gradient-ocean", badge: "Puzzle" },
  {
    scenario: "coffee",
    title: "Coffee Shop Rush",
    text: "Order breakfast and answer the barista in 45 seconds.",
    Icon: Coffee,
    tone: "bg-gradient-interview",
    badge: "45s",
  },
  {
    scenario: "subway",
    title: "Subway Gate Emergency",
    text: "Ask for the correct terminal before your train leaves.",
    Icon: TrainFront,
    tone: "bg-gradient-travel",
    badge: "Timed",
  },
] as const;

function Arcade() {
  const tile =
    "group tactile relative flex flex-col overflow-hidden rounded-3xl bg-card";
  return (
    <MobileShell>
      <div className="game-shine relative flex items-center gap-3 overflow-hidden rounded-[1.75rem] bg-gradient-violet p-5 text-primary-foreground sm:p-7">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-card/25 text-primary-foreground backdrop-blur">
          <Gamepad2 aria-hidden="true" />
        </span>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Arcade</h1>
      </div>
      <section className="mt-6" aria-labelledby="arcade-games">
        <h2 id="arcade-games" className="mb-3 font-display text-2xl font-semibold">
          Games &amp; roleplay
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {games.map(({ to, title, text, Icon, tone, badge }) => (
            <Link to={to} key={to} className={tile}>
              <Tile title={title} text={text} Icon={Icon} tone={tone} badge={badge} />
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-6" aria-labelledby="arcade-missions">
        <h2 id="arcade-missions" className="mb-3 font-display text-2xl font-semibold">
          Speaking missions
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {missions.map(({ title, text, Icon, tone, badge, ...mission }) => (
            <Link
              to="/mission"
              search={"scenario" in mission ? { scenario: mission.scenario } : {}}
              key={title}
              className={tile}
            >
              <Tile title={title} text={text} Icon={Icon} tone={tone} badge={badge} />
            </Link>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}

function Tile({
  title,
  text,
  Icon,
  tone,
  badge,
}: {
  title: string;
  text: string;
  Icon: typeof Zap;
  tone: string;
  badge: string;
}) {
  return (
    <>
      <div className={`game-shine relative flex h-24 items-center justify-between px-4 ${tone}`}>
        <span className="grid size-14 place-items-center rounded-2xl bg-card/25 text-primary-foreground backdrop-blur motion-safe:transition-transform motion-safe:group-hover:-rotate-6 motion-safe:group-hover:scale-110">
          <Icon aria-hidden="true" className="size-7" />
        </span>
        <span className="rounded-full bg-card/90 px-2.5 py-1 text-xs font-extrabold text-foreground">
          {badge}
        </span>
      </div>
      <div className="flex grow flex-col p-4">
        <h3 className="font-display text-lg font-bold leading-tight">{title}</h3>
        <p className="mt-1 grow text-sm text-muted-foreground">{text}</p>
        <span className="mt-3 inline-flex items-center gap-1 self-start rounded-full bg-primary px-3 py-1 font-display text-sm font-bold text-primary-foreground">
          Play <ArrowUpRight aria-hidden="true" className="size-4" />
        </span>
      </div>
    </>
  );
}
