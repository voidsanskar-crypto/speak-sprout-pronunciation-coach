import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Flame, Languages, Lock, Star, Target, Zap } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MobileShell } from "@/components/speakup/MobileShell";
import { LanguagePicker } from "@/components/speakup/LanguagePicker";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { resetProgress, setTranslationLanguage, useProgress } from "@/hooks/use-progress";
import { getAchievements } from "@/lib/achievements";
import { PHRASES } from "@/lib/phrases";
import {
  currentStreak,
  lastNDays,
  masteredIds,
  soundAverage,
  toDateKey,
  weakestSounds,
} from "@/lib/progress";
import { SOUND_IDS, SOUNDS } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Your Progress — Speak Sprout" },
      {
        name: "description",
        content: "Track weekly practice, phrase progress, and suggested sound drills.",
      },
      { property: "og:title", content: "Your Progress — Speak Sprout" },
      {
        property: "og:description",
        content: "Weekly activity, practice scores, suggested sound drills and achievements.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgressPage,
});

const dayLabel = (key: string) => {
  const [y = 2000, m = 1, d = 1] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
};

function ProgressPage() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const [pickerOpen, setPickerOpen] = useState(false);
  const today = hydrated ? toDateKey(new Date()) : "2000-01-01";
  const days = lastNDays(today, 7);

  const weekly = days.map((d) => {
    const list = progress.attempts.filter((a) => a.date === d);
    return {
      day: dayLabel(d),
      phrases: new Set(list.map((a) => a.phraseId)).size,
      avg: list.length ? Math.round(list.reduce((s, a) => s + a.score, 0) / list.length) : null,
    };
  });
  const overallAvg = progress.attempts.length
    ? Math.round(progress.attempts.reduce((s, a) => s + a.score, 0) / progress.attempts.length)
    : 0;
  const mastered = masteredIds(progress).length;
  const streak = hydrated ? currentStreak(progress, today) : 0;
  const weak = weakestSounds(progress);
  const untried = SOUND_IDS.filter((s) => !weak.some((w) => w.id === s));
  const achievements = getAchievements(progress);

  return (
    <MobileShell>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Your progress</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Review your practice and choose a sound drill.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={<Flame className="fill-flame text-flame" />}
          value={`${streak}`}
          label="Day streak"
        />
        <StatTile
          icon={<Zap className="fill-sun text-sun" />}
          value={`${progress.xp}`}
          label="Total XP"
        />
        <StatTile
          icon={<Star className="fill-success text-success" />}
          value={`${mastered}/${PHRASES.length}`}
          label="Phrases mastered"
        />
        <StatTile
          icon={<Target className="text-primary" />}
          value={progress.attempts.length ? `${overallAvg}%` : "–"}
          label="Average practice score"
        />
      </div>

      <div className="grid gap-x-3 md:grid-cols-2">
        <Card title="Weekly activity" subtitle="Phrases practiced per day">
          <div className="h-44">
            {hydrated && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{ borderRadius: 16, border: "1px solid var(--border)" }}
                  />
                  <Bar
                    dataKey="phrases"
                    name="Phrases"
                    fill="var(--primary)"
                    radius={[10, 10, 4, 4]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="Average score trend" subtitle="Last 7 days">
          <div className="h-44">
            {hydrated && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weekly} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid var(--border)" }} />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    name="Avg score"
                    stroke="var(--accent)"
                    strokeWidth={3.5}
                    dot={{ r: 4, fill: "var(--accent)" }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card
        title="Suggested sound drills"
        subtitle="Percentages reflect transcript matches for words with each target sound."
      >
        <ul className="space-y-2.5">
          {weak.map((w) => (
            <SoundRow key={w.id} id={w.id} average={w.average} attempts={w.attempts} />
          ))}
          {untried.map((s) => (
            <SoundRow
              key={s}
              id={s}
              average={soundAverage(progress.sounds[s])}
              attempts={progress.sounds[s]?.attempts ?? 0}
            />
          ))}
        </ul>
      </Card>

      <Card
        title="Achievements"
        subtitle={`${achievements.filter((a) => a.unlocked).length} of ${achievements.length} unlocked`}
      >
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={cn(
                "relative overflow-hidden rounded-3xl border p-4 transition-transform",
                a.unlocked
                  ? "border-transparent bg-gradient-hero text-primary-foreground shadow-pop"
                  : "border-border bg-muted/60",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  a.unlocked ? "bg-card/25" : "bg-card text-muted-foreground",
                )}
              >
                {a.unlocked ? <Award className="size-5" /> : <Lock className="size-4" />}
              </span>
              <p className="mt-2 font-display text-base font-semibold leading-tight">{a.title}</p>
              <p className={cn("text-xs", a.unlocked ? "opacity-90" : "text-muted-foreground")}>
                {a.description}
              </p>
              {!a.unlocked && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round(a.progress * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Settings">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Languages className="size-5 text-primary" /> Translation language
          </div>
          <Button variant="chip" size="sm" className="h-9 px-4" onClick={() => setPickerOpen(true)}>
            {progress.translationLanguage ?? "Choose"}
          </Button>
        </div>
        <button
          className="mt-4 text-xs font-bold text-muted-foreground underline-offset-2 hover:text-danger hover:underline"
          onClick={() => {
            if (window.confirm("Reset all your progress? This can't be undone.")) resetProgress();
          }}
        >
          Reset progress
        </button>
      </Card>

      <LanguagePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={progress.translationLanguage}
        onSelect={setTranslationLanguage}
      />
    </MobileShell>
  );
}

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 [&_svg]:size-5">
      {icon}
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 min-w-0 rounded-[1.5rem] border border-border bg-card p-5">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {subtitle && <p className="mb-3 text-sm text-muted-foreground">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </section>
  );
}

function SoundRow({
  id,
  average,
  attempts,
}: {
  id: keyof typeof SOUNDS;
  average: number | null;
  attempts: number;
}) {
  const s = SOUNDS[id];
  const tone =
    average === null
      ? "bg-muted-foreground/30"
      : average >= 80
        ? "bg-success"
        : average >= 55
          ? "bg-warning"
          : "bg-danger";
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary font-display text-base font-bold text-secondary-foreground">
        {s.label}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between text-sm">
          <span className="truncate font-bold">
            {s.ipa} <span className="font-semibold text-muted-foreground">· {s.example}</span>
          </span>
          <span className="ml-2 font-extrabold">{average === null ? "–" : `${average}%`}</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full", tone)} style={{ width: `${average ?? 0}%` }} />
        </div>
        <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
          {attempts ? `${attempts} words practiced` : "Not practiced yet"}
        </p>
      </div>
      <Button asChild variant="hero" size="sm" className="h-9 px-4">
        <Link to="/practice" search={{ sound: id }}>
          Drill
        </Link>
      </Button>
    </li>
  );
}
