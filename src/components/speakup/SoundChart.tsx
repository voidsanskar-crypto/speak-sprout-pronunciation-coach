import { Link } from "@tanstack/react-router";
import { AudioLines, Search, Volume2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePhonemeAudio } from "@/hooks/use-phoneme-audio";
import { PHONEME_IPA, SOUND_COACHING, type CoachedSound } from "@/lib/phonemes";
import { useProgress } from "@/hooks/use-progress";
import { soundAverage } from "@/lib/progress";
import { ACCENT_DRILLS } from "@/lib/accent-drills";
import { useLocalProfile } from "@/hooks/use-local-profile";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Consonants",
    phones: {
      P: "pen",
      B: "book",
      T: "tea",
      D: "day",
      K: "key",
      G: "go",
      CH: "chair",
      JH: "jump",
      F: "fan",
      V: "van",
      TH: "think",
      DH: "this",
      S: "sun",
      Z: "zoo",
      SH: "ship",
      ZH: "vision",
      HH: "hat",
      M: "moon",
      N: "night",
      NG: "sing",
      L: "light",
      R: "right",
      W: "we",
      Y: "yes",
    },
  },
  {
    label: "Vowels",
    phones: {
      IY: "sheep",
      IH: "ship",
      EH: "bet",
      AE: "bat",
      AX: "about",
      AH: "cup",
      AA: "father",
      AO: "caught",
      UH: "book",
      UW: "pool",
      ER: "bird",
      AXR: "butter",
    },
  },
  {
    label: "Diphthongs",
    phones: {
      EY: "day",
      AY: "my",
      OW: "go",
      AW: "now",
      OY: "boy",
    },
  },
] as const satisfies readonly { label: string; phones: Partial<Record<CoachedSound, string>> }[];

const examples: Record<CoachedSound, string> = {
  ...groups[0].phones,
  ...groups[1].phones,
  ...groups[2].phones,
};
type Group = (typeof groups)[number]["label"];

export function SoundChart() {
  const { phonemeMatches } = useProgress();
  const language = useLocalProfile()?.nativeLanguage;
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<Group>("Consonants");
  const [selected, setSelected] = useState<CoachedSound>("TH");
  const { play, audioError } = usePhonemeAudio();
  const term = query
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");
  const results = groups.flatMap(({ label, phones }) => {
    if (!term && label !== group) return [];
    const matches = (Object.keys(phones) as CoachedSound[]).filter(
      (code) =>
        !term ||
        [code.toLowerCase(), PHONEME_IPA[code], examples[code], label.toLowerCase()].some((value) =>
          value.includes(term),
        ),
    );
    return matches.length ? [{ label, matches }] : [];
  });
  const selectedScore = soundAverage(phonemeMatches?.[selected]);
  const pinned = language ? ACCENT_DRILLS[language].map(({ phone }) => phone) : [];

  return (
    <section
      aria-labelledby="phoneme-chart"
      className="rounded-[1.75rem] border-2 border-border bg-card p-4 shadow-card sm:p-6"
    >
      <h2
        id="phoneme-chart"
        className="flex items-center gap-2 font-display text-2xl font-semibold"
      >
        <AudioLines aria-hidden="true" className="size-5 text-primary" /> English phoneme chart
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Colors reflect word-match history. Grey means no comparisons yet.
      </p>
      {pinned.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-bold">Your accent focus</span>
          {pinned.map((phone) => (
            <Button
              key={phone}
              variant="soft"
              size="sm"
              type="button"
              onClick={() => {
                setSelected(phone);
                play(phone);
              }}
            >
              /{PHONEME_IPA[phone]}/
            </Button>
          ))}
        </div>
      )}
      <label htmlFor="sound-search" className="mt-3 block text-sm font-bold">
        Find a sound
      </label>
      <div className="relative mt-1.5">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="sound-search"
          type="search"
          autoComplete="off"
          placeholder="IPA symbol or example, e.g. θ or think"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-11 pl-9"
        />
      </div>
      {!term && (
        <div aria-label="Sound groups" role="group" className="mt-3 flex flex-wrap gap-1.5">
          {groups.map(({ label }) => (
            <Button
              key={label}
              type="button"
              size="sm"
              variant={group === label ? "hero" : "soft"}
              aria-pressed={group === label}
              onClick={() => setGroup(label)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
      <section
        aria-label="Selected sound"
        className="mt-4 rounded-2xl bg-primary-soft p-3.5 sm:p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div aria-live="polite">
            <h3 className="font-display text-lg font-bold">
              /{PHONEME_IPA[selected]}/{" "}
              <span className="text-sm font-medium">as in {examples[selected]}</span>
            </h3>
            <p className="mt-1 text-sm">{SOUND_COACHING[selected]}</p>
          </div>
          <Button
            size="icon"
            variant="soft"
            type="button"
            aria-label={`Replay /${PHONEME_IPA[selected]}/`}
            onClick={() => play(selected)}
          >
            <Volume2 aria-hidden="true" />
          </Button>
        </div>
        <p className="mt-2 text-xs font-bold">
          {selectedScore === null
            ? "No word-match history yet"
            : `${scoreLabel(selectedScore)} · ${selectedScore}% word match`}
        </p>
        <Button asChild variant="hero" size="sm" className="mt-3">
          <Link to="/practice" search={{ phone: selected }}>
            Practice /{PHONEME_IPA[selected]}/
          </Link>
        </Button>
        {audioError && (
          <p role="status" className="mt-2 text-xs text-danger">
            This sound sample couldn’t play.
          </p>
        )}
      </section>
      {results.length ? (
        results.map(({ label, matches }) => (
          <div key={label} className="mt-4">
            {term && <h3 className="mb-2 text-sm font-bold">{label}</h3>}
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 xl:grid-cols-8">
              {matches.map((code) => {
                const score = soundAverage(phonemeMatches?.[code]);
                return (
                  <button
                    key={code}
                    type="button"
                    aria-label={`Hear /${PHONEME_IPA[code]}/ as in ${examples[code]}${score === null ? "" : `, ${score}% word match`}`}
                    aria-pressed={code === selected}
                    onClick={() => {
                      setSelected(code);
                      play(code);
                    }}
                    className={cn(
                      "relative min-h-16 rounded-2xl border-2 px-1 py-2 text-center outline-offset-2 shadow-[0_3px_0_var(--tactile-edge)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none",
                      code === selected && "ring-2 ring-primary ring-offset-1",
                      score === null
                        ? "border-border bg-card opacity-80"
                        : score >= 85
                          ? "border-success/35 bg-success-soft"
                          : score >= 70
                            ? "border-warning/35 bg-warning-soft"
                            : "border-danger/35 bg-danger-soft",
                    )}
                  >
                    {score !== null && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute right-1.5 top-1.5 size-2 rounded-full",
                          score >= 85 ? "bg-success" : score >= 70 ? "bg-warning" : "bg-danger",
                        )}
                      />
                    )}
                    <span className="block font-display text-xl font-bold text-primary">
                      /{PHONEME_IPA[code]}/
                    </span>
                    <span className="block text-xs text-muted-foreground">{examples[code]}</span>
                    {score !== null && (
                      <span aria-hidden="true" className="block text-xs font-bold">
                        {score}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          No sound matches that search.
        </p>
      )}
    </section>
  );
}

function scoreLabel(score: number) {
  if (score >= 85) return "Mastered";
  return score >= 70 ? "Improving" : "Needs work";
}
