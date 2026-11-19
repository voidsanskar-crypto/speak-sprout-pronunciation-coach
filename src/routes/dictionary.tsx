import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { SpeechPrompt } from "@/components/speakup/SpeechPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ScoreResult } from "@/lib/scoring";
import { stopSpeaking } from "@/lib/speech";

type Phonetic = { text?: string; audio?: string };
type Meaning = { partOfSpeech: string; definitions: { definition: string; example?: string }[] };
type Entry = { word: string; phonetic?: string; phonetics: Phonetic[]; meanings: Meaning[] };
type Lookup =
  | { kind: "idle" }
  | { kind: "loading"; word: string }
  | { kind: "error"; message: string }
  | { kind: "result"; entries: Entry[] };

export const Route = createFileRoute("/dictionary")({
  head: () => ({ meta: [{ title: "Pronunciation Dictionary — Speak Sprout" }] }),
  component: Dictionary,
});

function Dictionary() {
  const [query, setQuery] = useState("");
  const [request, setRequest] = useState<{ word: string } | null>(null);
  const [lookup, setLookup] = useState<Lookup>({ kind: "idle" });
  const [attempt, setAttempt] = useState<ScoreResult | null>(null);

  useEffect(() => {
    if (!request) return;
    const { word } = request;
    const controller = new AbortController();

    async function fetchEntry() {
      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
          { signal: controller.signal },
        );
        if (response.status === 404) {
          if (!controller.signal.aborted)
            setLookup({ kind: "error", message: `No dictionary entry found for “${word}”.` });
          return;
        }
        if (!response.ok) throw new Error("Dictionary request failed");
        const entries = (await response.json()) as Entry[];
        if (!controller.signal.aborted)
          setLookup(
            entries.length
              ? { kind: "result", entries }
              : { kind: "error", message: `No dictionary entry found for “${word}”.` },
          );
      } catch {
        if (!controller.signal.aborted)
          setLookup({
            kind: "error",
            message: "Dictionary lookup is unavailable right now. You can try the same word again.",
          });
      }
    }

    void fetchEntry();
    return () => controller.abort();
  }, [request]);

  function findWord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const word = query.trim().toLowerCase().replace(/’/g, "'");
    if (!/^[a-z]+(?:['-][a-z]+)*$/.test(word)) {
      setRequest(null);
      setLookup({ kind: "error", message: "Enter one English word, such as “thoughtful”." });
      return;
    }
    stopSpeaking();
    setAttempt(null);
    setLookup({ kind: "loading", word });
    setRequest({ word });
  }

  const entries = lookup.kind === "result" ? lookup.entries : [];
  const entry = entries[0];
  const phonetics = entries.flatMap(({ phonetics }) => phonetics);
  const pronunciation = entry?.phonetic || phonetics.find((item) => item.text)?.text;
  const recordedAudio = phonetics.find(
    (item) => item.audio?.startsWith("https://") || item.audio?.startsWith("//"),
  )?.audio;
  const audioUrl = recordedAudio?.startsWith("//") ? `https:${recordedAudio}` : recordedAudio;

  return (
    <MobileShell>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Pronunciation dictionary</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Find a word’s phonetic spelling, audio example, and definition.
      </p>
      <div className="max-w-2xl">
        <form
          onSubmit={findWord}
          className="mt-6 flex gap-2 rounded-2xl border border-border bg-card p-2"
        >
          <Input
            aria-label="English word"
            type="search"
            maxLength={80}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search an English word"
            className="min-w-0 flex-1 border-transparent shadow-none"
          />
          <Button type="submit" variant="hero" className="rounded-xl px-3" disabled={!query.trim()}>
            <Search aria-hidden="true" /> Search
          </Button>
        </form>
        <div role="status" className="text-sm">
          {lookup.kind === "loading" && (
            <p className="mt-4 text-muted-foreground">Looking up {lookup.word}…</p>
          )}
          {lookup.kind === "error" && (
            <p className="mt-4 rounded-xl bg-warning-soft p-3 text-warning">{lookup.message}</p>
          )}
        </div>
        {entry && (
          <>
            <section className="mt-5 rounded-[1.5rem] border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                  <BookOpen aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h2 className="break-words font-display text-3xl font-bold">{entry.word}</h2>
                  {pronunciation && <p className="mt-0.5 text-muted-foreground">{pronunciation}</p>}
                </div>
              </div>
              {audioUrl && (
                <audio
                  controls
                  preload="none"
                  src={audioUrl}
                  onPlay={stopSpeaking}
                  aria-label="Recorded dictionary example"
                  className="mt-4 h-10 w-full"
                />
              )}
              <div className="mt-4 space-y-3">
                {entries
                  .flatMap(({ meanings }) => meanings)
                  .slice(0, 3)
                  .map((meaning, index) => (
                    <div className="rounded-xl bg-muted p-3" key={index}>
                      <p className="text-xs font-extrabold text-primary">{meaning.partOfSpeech}</p>
                      <ol className="mt-1 space-y-2">
                        {meaning.definitions.slice(0, 2).map((definition, position) => (
                          <li className="text-sm" key={position}>
                            {definition.definition}
                            {definition.example && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                “{definition.example}”
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Source: Free Dictionary API</p>
            </section>
            <section className="mt-5">
              <h2 className="mb-2 font-display text-xl font-semibold">Practice this word</h2>
              <SpeechPrompt
                key={entry.word}
                text={entry.word}
                ipa={pronunciation}
                onScore={setAttempt}
              />
              {attempt && (
                <div role="status" className="mt-3 rounded-xl bg-primary-soft p-3 text-sm">
                  <p className="font-bold">{attempt.score}% word match</p>
                  <p className="mt-1 text-muted-foreground">Transcript: {attempt.transcript}</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </MobileShell>
  );
}
