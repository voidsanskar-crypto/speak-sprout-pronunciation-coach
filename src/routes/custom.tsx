import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { SpeechPrompt } from "@/components/speakup/SpeechPrompt";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approximateIpa } from "@/lib/assessment";
import type { ScoreResult } from "@/lib/scoring";

export const Route = createFileRoute("/custom")({ component: CustomPractice });

function CustomPractice() {
  const [draft, setDraft] = useState("");
  const [phrase, setPhrase] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
  return (
    <MobileShell nav={false}>
      <Button asChild variant="soft" size="icon-lg" aria-label="Back home">
        <Link to="/">
          <ArrowLeft />
        </Link>
      </Button>
      <h1 className="mt-5 font-display text-3xl font-bold">Practice your own</h1>
      <p className="mb-5 mt-2 text-sm text-muted-foreground">
        Paste a sentence or a short speech excerpt. Your text stays in this browser.
      </p>
      {!phrase ? (
        <div className="rounded-[2rem] bg-card p-5 shadow-card">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 600))}
            maxLength={600}
            rows={6}
            placeholder="Paste your sentence or presentation excerpt…"
            className="resize-y rounded-2xl bg-background"
          />
          <p className="mt-2 text-right text-xs text-muted-foreground">
            {draft.length}/600 characters
          </p>
          <Button
            className="mt-3 w-full"
            variant="hero"
            size="xl"
            disabled={!draft.trim()}
            onClick={() => {
              setPhrase(draft.trim());
              setResult(null);
            }}
          >
            Build my practice
            <ArrowLeft className="rotate-180" />
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-2xl bg-primary-soft p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-primary">
              Approximate IPA-style sound guide
            </p>
            <p className="mt-2 break-words font-display text-lg">/{approximateIpa(phrase)}/</p>
            <p className="mt-2 text-xs text-muted-foreground">
              A spelling-based guide; English spelling can’t reliably determine exact pronunciation.
            </p>
          </div>
          <SpeechPrompt key={phrase} text={phrase} onScore={setResult} />
          {result && (
            <div className="mt-4 rounded-2xl bg-card p-4">
              <p className="font-display text-2xl font-bold">Score: {result.score}%</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We heard: “{result.transcript || "No clear speech"}”
              </p>
              <Button className="mt-3" variant="soft" onClick={() => setResult(null)}>
                <RotateCcw /> Try again
              </Button>
            </div>
          )}
          <Button
            variant="soft"
            className="mt-4 w-full"
            onClick={() => {
              setPhrase("");
              setDraft("");
              setResult(null);
            }}
          >
            Edit text
          </Button>
        </>
      )}
    </MobileShell>
  );
}
