import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProgress } from "@/hooks/use-progress";
import { useTextTranslations } from "@/hooks/use-translations";
import { compareSpelling } from "@/lib/compare-spelling";
import {
  dictionarySoundContrast,
  SOUND_COACHING,
  type CoachedSound,
  type DictionaryContrast,
} from "@/lib/phoneme-review";
import type { ScoreResult, WordResult } from "@/lib/scoring";
import { speak, stopSpeaking } from "@/lib/speech";
import { cn } from "@/lib/utils";

const labels = {
  heading: "Words to review",
  expected: "Expected",
  heard: "Browser heard",
  missing: "Missing from the transcript",
  extra: "Extra words in the transcript",
  listen: "Listen",
  playSound: "Hear sound",
  audioError: "This sound sample couldn’t play.",
  soundContrast: "Dictionary sound contrast",
  soundGuide:
    "Tap a sound for a synthetic example and mouth placement. Highlights compare dictionary pronunciations of the two words.",
  guide:
    "Highlights show differences in spelling in the browser transcript. The app cannot tell which sounds you mispronounced.",
};
const messages = Object.entries(labels).map(([id, text]) => ({ id: `word-review:v1:${id}`, text }));

type ReviewProps = {
  words: WordResult[];
  extraWords: string[];
  contrasts: Map<number, DictionaryContrast>;
  onReplay: (word: string) => void;
  onSoundPlay?: (() => void) | undefined;
};

export function WordMatchReview({
  result,
  onReplay = (word) => speak(word, { slow: true }),
  onSoundPlay,
}: {
  result: ScoreResult;
  onReplay?: (word: string) => void;
  onSoundPlay?: () => void;
}) {
  const { translationLanguage } = useProgress();
  const words = result.words.filter((word) => word.status !== "correct");
  if (!words.length && !result.extraWords.length) return null;

  const contrasts = new Map<number, DictionaryContrast>();
  for (const word of words) {
    const contrast = dictionarySoundContrast(
      word.targetSpelling ?? word.target,
      word.heardSpelling ?? word.heard,
    );
    if (contrast) contrasts.set(word.index, contrast);
  }
  const props = { words, extraWords: result.extraWords, contrasts, onReplay, onSoundPlay };
  const language = translationLanguage?.trim();
  return language && !/^english$/i.test(language) ? (
    <LocalizedReview {...props} language={language} />
  ) : (
    <Review {...props} copy={labels} />
  );
}

function LocalizedReview({ language, ...props }: ReviewProps & { language: string }) {
  const sounds = new Set(
    [...props.contrasts.values()].flatMap(({ expected, heard }) =>
      [...expected, ...heard].map(({ phone }) => phone),
    ),
  );
  const tips = [...sounds].map((sound) => ({
    id: `sound-tip:v1:${sound}`,
    text: SOUND_COACHING[sound],
  }));
  const translation = useTextTranslations([...messages, ...tips], language);
  const copy = { ...labels };
  for (const key of Object.keys(labels) as (keyof typeof labels)[]) {
    copy[key] = translation.data?.[`word-review:v1:${key}`] ?? labels[key];
  }
  return (
    <>
      <Review {...props} copy={copy} translated={translation.data} />
      {translation.isError && (
        <p className="mt-2 text-xs text-muted-foreground">
          Translation is unavailable right now. Word review is shown in English.
        </p>
      )}
    </>
  );
}

function Review({
  words,
  extraWords,
  contrasts,
  onReplay,
  onSoundPlay,
  copy,
  translated,
}: ReviewProps & { copy: typeof labels; translated?: Record<string, string> | undefined }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [audioError, setAudioError] = useState(false);
  useEffect(() => () => audio.current?.pause(), []);

  function playPhone(phone: CoachedSound) {
    onSoundPlay?.();
    stopSpeaking();
    audio.current?.pause();
    setAudioError(false);
    const sample = new Audio(`${import.meta.env.BASE_URL}phonemes/${phone}.mp3`);
    audio.current = sample;
    void sample.play().catch(() => {
      if (audio.current === sample) setAudioError(true);
    });
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-3.5">
      <h3 dir="auto" className="font-display text-lg font-semibold">
        {copy.heading}
      </h3>
      <p dir="auto" className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {copy.guide}
      </p>
      {words.length > 0 && (
        <ul className="mt-2 max-h-56 divide-y divide-border overflow-y-auto">
          {words.map((word) => {
            const target = word.targetSpelling ?? word.target;
            const heard = word.heardSpelling ?? word.heard ?? "";
            const { expected, recognized } = compareSpelling(target, heard);
            const contrast = contrasts.get(word.index);
            const phoneProps = {
              activeChip,
              setActiveChip,
              playPhone,
              audioError,
              copy,
              translated,
            };
            return (
              <li
                key={word.index}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 py-2.5"
              >
                <div className="min-w-0">
                  <p dir="auto" className="text-xs font-bold text-muted-foreground">
                    {copy.expected}
                  </p>
                  <Letters letters={expected} />
                </div>
                <div className="min-w-0">
                  <p dir="auto" className="text-xs font-bold text-muted-foreground">
                    {copy.heard}
                  </p>
                  {recognized.length ? (
                    <Letters letters={recognized} />
                  ) : (
                    <p dir="auto" className="text-xs text-muted-foreground">
                      {copy.missing}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="soft"
                  aria-label={`${copy.listen}: ${target}`}
                  onClick={() => {
                    audio.current?.pause();
                    onReplay(target);
                  }}
                >
                  <Volume2 aria-hidden="true" />
                </Button>
                {contrast && (
                  <div className="col-span-full rounded-lg bg-primary-soft px-2.5 py-2">
                    <p dir="auto" className="text-xs font-bold">
                      {copy.soundContrast}
                    </p>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span dir="auto" className="text-xs text-muted-foreground">
                          {copy.expected}
                        </span>
                        <Phones
                          sounds={contrast.expected}
                          group={`${word.index}:expected`}
                          {...phoneProps}
                        />
                      </div>
                      <div>
                        <span dir="auto" className="text-xs text-muted-foreground">
                          {copy.heard}
                        </span>
                        <Phones
                          sounds={contrast.heard}
                          group={`${word.index}:heard`}
                          {...phoneProps}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {contrasts.size > 0 && (
        <p dir="auto" className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {copy.soundGuide}
        </p>
      )}
      {extraWords.length > 0 && (
        <p dir="auto" className="mt-2 break-words text-sm">
          <span>{copy.extra}</span>
          {" · "}
          <strong lang="en" dir="ltr">
            {extraWords.join(", ")}
          </strong>
        </p>
      )}
    </div>
  );
}

function Letters({ letters }: { letters: ReturnType<typeof compareSpelling>["expected"] }) {
  return (
    <p lang="en" dir="ltr" className="break-words text-base font-bold">
      {letters.map(({ letter, different }, index) =>
        different ? (
          <mark
            key={index}
            className="bg-danger-soft text-danger underline decoration-2 underline-offset-2"
          >
            {letter}
          </mark>
        ) : (
          <span key={index}>{letter}</span>
        ),
      )}
    </p>
  );
}

function Phones({
  sounds,
  group,
  activeChip,
  setActiveChip,
  playPhone,
  audioError,
  copy,
  translated,
}: {
  sounds: DictionaryContrast["expected"];
  group: string;
  activeChip: string | null;
  setActiveChip: (chip: string | null) => void;
  playPhone: (phone: CoachedSound) => void;
  audioError: boolean;
  copy: typeof labels;
  translated: Record<string, string> | undefined;
}) {
  return (
    <div dir="ltr" className="mt-1 flex flex-wrap gap-1">
      {sounds.map(({ phone, sound, different }, index) => {
        const id = `${group}:${index}`;
        return (
          <Popover
            key={id}
            open={activeChip === id}
            onOpenChange={(open) => {
              setActiveChip(open ? id : null);
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border px-2 font-semibold outline-offset-2 hover:brightness-95",
                  different
                    ? "phoneme-difference border-danger/65 bg-danger-soft text-danger"
                    : "border-border bg-card text-foreground",
                )}
                aria-label={`${copy.playSound} /${sound}/`}
                onClick={() => playPhone(phone)}
              >
                {sound}
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              sideOffset={8}
              collisionPadding={12}
              className="max-w-[calc(100vw-1.5rem)] rounded-xl px-3 py-2 text-sm"
              aria-label={`${copy.playSound} /${sound}/`}
              onOpenAutoFocus={(event) => event.preventDefault()}
            >
              <p dir="auto">{translated?.[`sound-tip:v1:${phone}`] ?? SOUND_COACHING[phone]}</p>
              {audioError && (
                <p role="status" className="mt-1 text-xs text-danger">
                  {copy.audioError}
                </p>
              )}
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
