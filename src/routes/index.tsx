import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, AudioLines, Gamepad2, Mic, Sprout } from "lucide-react";
import { Mascot } from "@/components/speakup/Mascot";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Ring } from "@/components/speakup/Ring";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { useLocalProfile } from "@/hooks/use-local-profile";
import { useProgress } from "@/hooks/use-progress";
import { ACCENT_DRILLS } from "@/lib/accent-drills";
import { PHONEME_IPA } from "@/lib/phonemes";
import { loadAssessment } from "@/lib/assessment";
import { DAILY_GOAL, phrasesDoneOn, toDateKey } from "@/lib/progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Speak Sprout — English Speaking Practice" },
      {
        name: "description",
        content:
          "Practice English one phrase at a time with audio examples, voice replay, and word-match feedback.",
      },
      { property: "og:title", content: "Speak Sprout — English Speaking Practice" },
      {
        property: "og:description",
        content:
          "Practice English one phrase at a time with audio examples, voice replay, and word-match feedback.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const progress = useProgress();
  const profile = useLocalProfile();
  const hydrated = useHydrated();
  const today = hydrated ? toDateKey(new Date()) : "";
  const done = hydrated ? phrasesDoneOn(progress, today) : 0;
  const assessment = hydrated ? loadAssessment() : null;
  const earDay = Boolean(today && (Date.parse(today) / 86_400_000) % 2);
  const goalReached = done >= DAILY_GOAL;
  const reviewCount = today ? progress.reviewDeck.filter((card) => card.due <= today).length : 0;

  return (
    <MobileShell>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <section className="relative isolate min-h-60 overflow-hidden rounded-[1.75rem] border border-primary/15 bg-primary-soft p-5 sm:p-7">
          <div
            aria-hidden="true"
            className="absolute -right-12 -top-16 -z-10 size-72 rounded-full bg-secondary sm:size-88"
          />
          <Mascot
            eager
            className="absolute -bottom-4 -right-7 -z-10 w-28 min-[375px]:-right-2 min-[375px]:w-36 sm:-bottom-7 sm:right-0 sm:w-48 xl:right-2 xl:w-53"
          />
          <div className="max-w-[15rem] sm:max-w-68">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-primary">
              <Sprout aria-hidden="true" className="size-4" />
              {assessment ? `${assessment.level} practice plan` : "Your daily session"}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-[1.05] [overflow-wrap:anywhere] sm:text-4xl">
              {profile ? `Welcome back, ${profile.name}!` : "Daily speaking practice"}
            </h1>
            <p className="mt-3 max-w-44 text-sm leading-relaxed text-muted-foreground sm:max-w-60">
              Review due words, practice three phrases, and finish with one quick listening round.
            </p>
            <Button
              asChild
              variant="hero"
              size="pill"
              className="mt-5 min-h-12 whitespace-normal px-3 text-left text-sm sm:px-4 sm:text-base"
            >
              <Link to="/daily-session">
                <Mic aria-hidden="true" /> Start today’s 5-minute session
              </Link>
            </Button>
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-[1.75rem] border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Today’s goal</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {goalReached
                  ? "Daily goal reached"
                  : `${DAILY_GOAL - done} ${DAILY_GOAL - done === 1 ? "phrase" : "phrases"} to go`}
              </p>
            </div>
            <div aria-label={`${done} of ${DAILY_GOAL} phrases practiced`}>
              <Ring
                value={Math.min(1, done / DAILY_GOAL)}
                size={66}
                stroke={7}
                barClassName="text-primary"
                trackClassName="text-primary-soft"
              >
                <span className="font-display text-lg font-bold">
                  {done}/{DAILY_GOAL}
                </span>
              </Ring>
            </div>
          </div>
        </section>
      </div>

      {profile?.nativeLanguage && (
        <Link
          to="/accent-x-ray"
          className="mt-3 flex items-center gap-3 rounded-[1.5rem] border border-primary/20 bg-primary-soft p-4 transition-colors hover:border-primary/50 sm:p-5"
        >
          <AudioLines aria-hidden="true" className="size-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-semibold">Your accent focus</span>
            <span className="block text-sm text-muted-foreground">
              {ACCENT_DRILLS[profile.nativeLanguage]
                .map(({ phone }) => `/${PHONEME_IPA[phone]}/`)
                .join(" · ")}
            </span>
          </span>
          <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-primary" />
        </Link>
      )}
      <Link
        to="/review"
        className="mt-3 flex items-center gap-3 rounded-[1.5rem] border border-border bg-card p-4 transition-colors hover:border-primary/35 hover:bg-primary-soft sm:p-5"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <CalendarClock aria-hidden="true" className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold">
            {reviewCount
              ? `${reviewCount} trouble ${reviewCount === 1 ? "word" : "words"} to practice today`
              : "Personal Review Deck"}
          </span>
          <span className="block text-xs text-muted-foreground">
            {reviewCount ? "Open today’s review" : "No trouble words due today"}
          </span>
        </span>
        <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-primary" />
      </Link>

      <section className="mt-3 flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-primary/20 bg-primary-soft p-4 sm:p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card text-primary">
          <Gamepad2 aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold">Today’s quick game</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {earDay
              ? "Ear Sprint · Hear the word and tap before time runs out."
              : "Pack for the train · Tell Kiki where each item goes."}
          </p>
        </div>
        <Button asChild variant="hero" className="w-full rounded-xl sm:w-auto">
          <Link to={earDay ? "/ear-sprint" : "/mission"}>
            Play now <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>
      <Link
        to="/skills"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary"
      >
        Explore the library <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </MobileShell>
  );
}
