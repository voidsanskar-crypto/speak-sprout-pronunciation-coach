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
import { canSpeak, speak } from "@/lib/speech";
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
  const [mastery, setMastery] = useState("All");
  const [group, setGroup] = useState<Group>("Consonants");
  const [chosen, setSelected] = useState<CoachedSound>("TH");
  const { play, stop, audioError } = usePhonemeAudio();
  const [listeningTo, setListeningTo] = useState<"word" | "sound">("word");
  const [wordError, setWordError] = useState(false);

  function hearWord(phone: CoachedSound, slow = false) {
    stop();
    setSelected(phone);
    setListeningTo("word");
    setWordError(!canSpeak());
    speak(examples[phone], { slow, onError: () => setWordError(true) });
  }

  function hearSound() {
    setListeningTo("sound");
    play(selected);
  }
  const term = query
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");
  const results = groups.flatMap(({ label, phones }) => {
    if (!term && label !== group) return [];
    const matches = (Object.keys(phones) as CoachedSound[])
      .filter((code) => {
        const score = soundAverage(phonemeMatches?.[code]);
        const status =
          score === null
            ? "Unpracticed"
            : score >= 85
              ? "Mastered"
              : score >= 70
                ? "Improving"
                : "Needs practice";
        return mastery === "All" || status === mastery;
      })
      .filter(
        (code) =>
          !term ||
          [code.toLowerCase(), PHONEME_IPA[code], examples[code], label.toLowerCase()].some(
            (value) => value.includes(term),
          ),
      );
    return matches.length ? [{ label, matches }] : [];
  });
  const visible = results.flatMap(({ matches }) => matches);
  const selected = visible.includes(chosen) ? chosen : (visible[0] ?? chosen);
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
                setGroup(groups.find(({ phones }) => Object.hasOwn(phones, phone))!.label);
                setQuery("");
                setMastery("All");
                hearWord(phone);
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
      <div
        role="group"
        aria-label="Filter by word-match history"
        className="mt-3 flex flex-wrap gap-2"
      >
        {["All", "Needs practice", "Improving", "Mastered", "Unpracticed"].map((label) => (
          <Button
            key={label}
            size="sm"
            variant={mastery === label ? "hero" : "soft"}
            aria-pressed={mastery === label}
            onClick={() => setMastery(label)}
          >
            {label}
          </Button>
        ))}
      </div>
      {visible.length > 0 && (
        <section
          aria-label="Selected sound"
          className="clay-card mt-4 rounded-2xl bg-primary-soft p-3.5 sm:p-4"
        >
          <div aria-live="polite">
            <h3 className="font-display text-lg font-bold">
              /{PHONEME_IPA[selected]}/{" "}
              <span className="text-sm font-medium">as in {examples[selected]}</span>
            </h3>
            <p className="mt-1 text-sm">{SOUND_COACHING[selected]}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="soft" type="button" onClick={() => hearWord(selected)}>
              <Volume2 aria-hidden="true" /> Hear word: {examples[selected]}
            </Button>
            <Button size="sm" variant="soft" type="button" onClick={() => hearWord(selected, true)}>
              Hear word slowly
            </Button>
            <Button size="sm" variant="soft" type="button" onClick={hearSound}>
              Hear /{PHONEME_IPA[selected]}/ alone
            </Button>
          </div>
          <p className="mt-2 text-xs font-bold">
            {selectedScore === null
              ? "No word-match history yet"
              : `${scoreLabel(selectedScore)} · ${selectedScore}% word match`}
          </p>
          <Button asChild variant="hero" size="sm" className="mt-3">
            <Link to="/practice" search={{ phone: selected, mini: true }}>
              Drill /{PHONEME_IPA[selected]}/ · 3 phrases
            </Link>
          </Button>
          {(listeningTo === "sound" ? audioError : wordError) && (
            <p role="status" className="mt-2 text-xs text-danger">
              {listeningTo === "sound"
                ? "Sound sample unavailable. Try hearing the full word."
                : "Word audio unavailable in this browser. Try the isolated sound."}
            </p>
          )}
        </section>
      )}
      {results.length ? (
        results.map(({ label, matches }) => (
          <div key={label} className="mt-4">
            {term && <h3 className="mb-2 text-sm font-bold">{label}</h3>}
            <div className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-6 xl:grid-cols-8">
              {matches.map((code) => {
                const score = soundAverage(phonemeMatches?.[code]);
                return (
                  <button
                    key={code}
                    type="button"
                    aria-label={`Hear word ${examples[code]} for /${PHONEME_IPA[code]}/${score === null ? "" : `, ${score}% word match`}`}
                    aria-pressed={code === selected}
                    onClick={() => hearWord(code)}
                    className={cn(
                      "sound-keycap relative min-h-16 rounded-2xl border-2 px-1 py-2 text-center outline-offset-4 focus-visible:outline-2 focus-visible:outline-primary",
                      code === selected && "ring-2 ring-primary ring-offset-1",
                      score === null
                        ? "border-border bg-card"
                        : score >= 85
                          ? "border-success/35 bg-success-soft"
                          : score >= 70
                            ? "border-warning/35 bg-warning-soft"
                            : "border-danger/35 bg-danger-soft",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute right-1.5 top-1.5 size-2 rounded-full shadow-[inset_0_1px_0_#ffffff70]",
                        score === null
                          ? "bg-muted-foreground/45"
                          : score >= 85
                            ? "bg-success"
                            : "bg-warning",
                      )}
                    />
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
          No sounds match these filters. Try another group or choose All.
        </p>
      )}
    </section>
  );
}

function scoreLabel(score: number) {
  if (score >= 85) return "Mastered";
  return score >= 70 ? "Improving" : "Needs work";
}
