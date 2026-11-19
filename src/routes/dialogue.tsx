import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { SpeechPrompt } from "@/components/speakup/SpeechPrompt";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/speech";
import type { ScoreResult } from "@/lib/scoring";

const scenarios = [
  {
    title: "At a café",
    role: "Barista",
    turns: [
      ["Hi there! What can I get started for you?", "Hi! Could I have a cappuccino, please?"],
      [
        "Sure. Would you like that for here or to go?",
        "To go, please. Could I also get a glass of water?",
      ],
      ["Absolutely. Anything else today?", "That’s everything. How much do I owe you?"],
    ],
  },
  {
    title: "Hotel check-in",
    role: "Receptionist",
    turns: [
      [
        "Welcome to the Grand Hotel. How can I help you?",
        "Hello, I have a reservation under the name Taylor.",
      ],
      ["I found it. Could I see your photo ID, please?", "Of course. Here is my passport."],
      [
        "Thank you. Your room is ready. Would you like help with your bags?",
        "Yes, that would be lovely. What time is breakfast?",
      ],
    ],
  },
  {
    title: "Meet a recruiter",
    role: "Recruiter",
    turns: [
      [
        "Thanks for joining. Could you tell me a little about yourself?",
        "I’m a product designer with five years of experience.",
      ],
      [
        "What kind of work are you most proud of?",
        "I led a project that made our mobile app easier to use.",
      ],
      [
        "What would you like to ask me about the role?",
        "Could you tell me what success looks like in this position?",
      ],
    ],
  },
] as const;

export const Route = createFileRoute("/dialogue")({ component: Dialogue });

function Dialogue() {
  const [scenario, setScenario] = useState<number | null>(null);
  const [turn, setTurn] = useState(0);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const selected = scenario === null ? null : scenarios[scenario];
  const exchange = selected?.turns[turn];
  const reset = () => {
    setScenario(null);
    setTurn(0);
    setScore(null);
  };
  return (
    <MobileShell nav={false}>
      <Button variant="soft" size="icon-lg" aria-label="Back home" onClick={reset}>
        <ArrowLeft />
      </Button>
      {!selected ? (
        <>
          <h1 className="mt-5 font-display text-3xl font-bold">Conversation practice</h1>
          <p className="mb-5 mt-2 text-sm text-muted-foreground">
            Choose a scene. Speak your line, hear your conversation partner, and get a score.
          </p>
          <div className="space-y-3">
            {scenarios.map((item, index) => (
              <button
                key={item.title}
                onClick={() => {
                  setScenario(index);
                  setTurn(0);
                  setScore(null);
                  speak(item.turns[0]![0]);
                }}
                className="w-full rounded-[2rem] bg-card p-5 text-left shadow-card transition-transform hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-primary">
                  <MessageCircle className="size-4" /> Roleplay
                </span>
                <span className="mt-2 block font-display text-xl font-bold">{item.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Speak with a {item.role.toLowerCase()}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 className="mt-5 font-display text-3xl font-bold">{selected.title}</h1>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            You · {selected.role} · Turn {turn + 1} of {selected.turns.length}
          </p>
          {turn === selected.turns.length ? (
            <div className="rounded-[2rem] bg-card p-6 text-center shadow-card">
              <MessageCircle className="mx-auto size-10 text-primary" />
              <h2 className="mt-3 font-display text-2xl font-bold">Scene complete!</h2>
              <p className="mt-2 text-muted-foreground">
                You practiced {turn} responses. Nice work keeping the conversation moving.
              </p>
              <Button className="mt-5 w-full" variant="hero" onClick={reset}>
                Choose another scene
              </Button>
            </div>
          ) : (
            exchange && (
              <>
                <div className="mb-4 rounded-[2rem] bg-secondary p-5 text-secondary-foreground">
                  <p className="text-xs font-extrabold uppercase tracking-wide">
                    {selected.role} says
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold">“{exchange[0]}”</p>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="soft"
                    onClick={() => speak(exchange[0])}
                  >
                    Hear {selected.role.toLowerCase()}
                  </Button>
                </div>
                {score ? (
                  <div className="rounded-[2rem] bg-card p-5 shadow-card">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                      Your response
                    </p>
                    <p className="mt-2 font-semibold">“{exchange[1]}”</p>
                    <p className="mt-3 font-display text-2xl font-bold text-primary">
                      {score.score}%
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We heard: “{score.transcript || "No clear speech"}”
                    </p>
                    <Button
                      className="mt-4 w-full"
                      variant="hero"
                      onClick={() => {
                        const nextTurn = turn + 1;
                        setScore(null);
                        setTurn(nextTurn);
                        const nextLine = selected.turns[nextTurn]?.[0];
                        if (nextLine) speak(nextLine);
                      }}
                    >
                      Continue conversation <ArrowRight />
                    </Button>
                  </div>
                ) : (
                  <SpeechPrompt text={exchange[1]} onScore={setScore} />
                )}
              </>
            )
          )}
        </>
      )}
    </MobileShell>
  );
}
