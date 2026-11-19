import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/use-progress";
import { useTextTranslations } from "@/hooks/use-translations";
import { compareSpelling } from "@/lib/compare-spelling";
import {
  dictionarySoundContrast,
  SOUND_COACHING,
  type DictionaryContrast,
} from "@/lib/phoneme-review";
import type { ScoreResult, WordResult } from "@/lib/scoring";
import { speak } from "@/lib/speech";

const labels = {
  heading: "Words to review",
  expected: "Expected",
  heard: "Browser heard",
  missing: "Missing from the transcript",
  extra: "Extra words in the transcript",
  listen: "Listen",
  soundContrast: "Dictionary sound contrast",
  soundGuide:
    "These are dictionary pronunciations of the two words. The transcript alone cannot identify the sounds you produced.",
  guide:
    "Highlights show differences in spelling in the browser transcript. The app cannot tell which sounds you mispronounced.",
};
const messages = Object.entries(labels).map(([id, text]) => ({ id: `word-review:v1:${id}`, text }));

type ReviewProps = {
  words: WordResult[];
  extraWords: string[];
  contrasts: Map<number, DictionaryContrast>;
  onReplay: (word: string) => void;
};

export function WordMatchReview({
  result,
  onReplay = (word) => speak(word, { slow: true }),
}: {
  result: ScoreResult;
  onReplay?: (word: string) => void;
}) {
  const { translationLanguage } = useProgress();
  const words = result.words.filter((word) => word.status !== "correct");
  if (!words.length && !result.extraWords.length) return null;

  const contrasts = new Map<number, DictionaryContrast>();
  for (const word of words) {
    const contrast = dictionarySoundContrast(word.target, word.heard);
    if (contrast) contrasts.set(word.index, contrast);
  }
  const props = { words, extraWords: result.extraWords, contrasts, onReplay };
  const language = translationLanguage?.trim();
  return language && !/^english$/i.test(language) ? (
    <LocalizedReview {...props} language={language} />
  ) : (
    <Review {...props} copy={labels} />
  );
}

function LocalizedReview({ language, ...props }: ReviewProps & { language: string }) {
  const sounds = new Set(Array.from(props.contrasts.values(), (contrast) => contrast.tip));
  const tips = [...sounds].flatMap((sound) =>
    sound ? [{ id: `sound-tip:v1:${sound}`, text: SOUND_COACHING[sound] }] : [],
  );
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
  copy,
  translated,
}: ReviewProps & { copy: typeof labels; translated?: Record<string, string> | undefined }) {
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
            const { expected, recognized } = compareSpelling(word.target, word.heard ?? "");
            const contrast = contrasts.get(word.index);
            const tip = contrast?.tip;
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
                  aria-label={`${copy.listen}: ${word.target}`}
                  onClick={() => onReplay(word.target)}
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
                        <Phones sounds={contrast.expected} />
                      </div>
                      <div>
                        <span dir="auto" className="text-xs text-muted-foreground">
                          {copy.heard}
                        </span>
                        <Phones sounds={contrast.heard} />
                      </div>
                    </div>
                    {tip && (
                      <p dir="auto" className="mt-2 text-xs leading-relaxed">
                        {translated?.[`sound-tip:v1:${tip}`] ?? SOUND_COACHING[tip]}
                      </p>
                    )}
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

function Phones({ sounds }: { sounds: DictionaryContrast["expected"] }) {
  return (
    <p dir="ltr" className="break-words font-semibold">
      /
      {sounds.map(({ sound, different }, index) => (
        <span
          key={index}
          className={
            different ? "text-danger underline decoration-2 underline-offset-2" : undefined
          }
        >
          {sound}
        </span>
      ))}
      /
    </p>
  );
}
