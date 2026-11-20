import { useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import avatar from "@/assets/kiki-guide.png";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Guidance = readonly [instruction: string, question: string, tip: string];

const guidance: Record<string, Guidance> = {
  "/": [
    "Start today’s session and I’ll meet you at each stop.",
    "What’s in my session?",
    "We’ll warm up with any due review words, try three phrases, then finish with a listening round.",
  ],
  "/daily-session": [
    "Take one prompt at a time. You can find me here if you get stuck.",
    "How should I practise a phrase?",
    "Listen once for the stressed word. Say the whole phrase again, giving that word a little more time.",
  ],
  "/practice": [
    "Listen to the example, then record the phrase in your own voice.",
    "Why did a word turn red?",
    "The browser heard a different word or missed it. Listen to your replay, then try the phrase again slowly.",
  ],
  "/custom": [
    "Choose a sentence you actually want to say out loud.",
    "Give me an example",
    "Try “Could you tell me where the station is?” Pause after “tell me” on your first try, then join the two parts.",
  ],
  "/dialogue": [
    "Pick a situation and use its checkpoints to guide the conversation.",
    "How do I keep talking?",
    "Answer your partner, then ask one short follow-up. At a hotel you might ask, “What time is breakfast?”",
  ],
  "/mission": [
    "Tell me what to pack and which pocket it belongs in.",
    "Show me a command",
    "Try “Put the keys in the inside pocket.” If I ask which pocket, just say its name.",
  ],
  coffee: [
    "Read the order ticket before you start the clock.",
    "Help me start my order",
    "Try “I’d like a breakfast sandwich and a latte, please.” Then listen for the barista’s question about milk.",
  ],
  subway: [
    "Check the line and destination on your departure board.",
    "How do I ask for directions?",
    "Try “Where does the Blue Line to Riverside board?” Then confirm the entrance with the station agent.",
  ],
  "/minimal-pairs": [
    "Listen for the one sound that separates the two words.",
    "What should I listen for?",
    "For ship and sheep, listen to the middle. Ship has a relaxed vowel. In sheep, the tongue sits higher and farther forward.",
  ],
  "/ear-sprint": [
    "Turn your sound on before starting. Tap the word you hear.",
    "What if I miss one?",
    "Listen fresh on the next turn. For more time with a contrast, try Minimal Pairs in the Arcade.",
  ],
  "/review": [
    "Say the due word on the front of the card.",
    "When does a word graduate?",
    "Get three green reviews in a row. Come back when the word is due for your next try.",
  ],
  "/assessment": [
    "Use your natural speaking pace so your report reflects everyday speech.",
    "How should I read my results?",
    "Use the word matches to pick what to practise next. A transcript can miss small sound differences even when it recognizes the word.",
  ],
  "/skills": [
    "Choose a sound on the chart to hear it and find a drill.",
    "Which sound first?",
    "Start with a sound from a word you recently struggled with. Listen to its sample before trying the word again.",
  ],
  "/accent-x-ray": [
    "Choose your first language to explore contrasts that may feel unfamiliar.",
    "Which contrast should I try?",
    "Say both example words out loud. Pick a pair that feels similar in your mouth and practise switching between the two.",
  ],
  "/arcade": [
    "Choose Ear Sprint for listening or a mission for conversation.",
    "Can I play quietly?",
    "Use headphones and try Ear Sprint. You answer by tapping the word you hear.",
  ],
  "/progress": [
    "Look back at your practice and choose a focus for tomorrow.",
    "What should I practise next?",
    "Open your Review Deck on Today. Start with a due word and use it in a sentence of your own.",
  ],
  "/dictionary": [
    "Look up a word you want to use in conversation.",
    "How can I remember it?",
    "Say the word once by itself, then use it in a sentence about something you did today.",
  ],
  "/login": [
    "Save your name so SayTempo can greet you.",
    "Where is my profile saved?",
    "Your profile and progress stay in this browser on this device.",
  ],
};

export function KikiGuide({ aboveNavigation = false }: { aboveNavigation?: boolean }) {
  const topic = useLocation({
    select: ({ pathname, searchStr }) => {
      const page = pathname.replace(/\/$/, "") || "/";
      const scenario = new URLSearchParams(searchStr).get("scenario");
      return page === "/mission" && (scenario === "coffee" || scenario === "subway")
        ? scenario
        : page;
    },
  });
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 mx-auto flex max-w-2xl justify-end px-4 lg:bottom-6 lg:max-w-7xl lg:px-8",
        aboveNavigation
          ? "bottom-[calc(4.25rem+max(env(safe-area-inset-bottom),8px))]"
          : "bottom-[max(env(safe-area-inset-bottom),1rem)]",
      )}
    >
      <GuideBubble key={topic} advice={guidance[topic] ?? guidance["/"]!} />
    </div>
  );
}

function GuideBubble({ advice }: { advice: Guidance }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [instruction, question, tip] = advice;
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setExpanded(false);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Ask Kiki for help"
          title="Ask Kiki"
          className="group tactile-btn tactile-neutral pointer-events-auto inline-flex items-center rounded-full border border-primary/20 bg-card pl-1 pr-4 font-display font-bold text-primary shadow-card hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <img
            src={avatar}
            alt=""
            width="72"
            height="72"
            className="size-16 lg:size-[4.5rem] motion-safe:transition-transform motion-safe:group-hover:-rotate-6"
          />
          <span>Ask Kiki</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={10}
        align="end"
        collisionPadding={12}
        aria-label="Kiki’s practice guide"
        className="w-80 max-w-[calc(100vw-24px)] clay-card rounded-3xl p-4"
      >
        <div className="flex items-center gap-2">
          <img
            src={avatar}
            alt=""
            width="48"
            height="48"
            className="size-12 rounded-full bg-primary-soft"
          />
          <h2 className="grow font-display text-lg font-bold">Kiki’s practice guide</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close Kiki’s guide"
            className="grid size-9 place-items-center rounded-full hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>
        <p className="my-3 text-sm">{instruction}</p>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="rounded-xl bg-primary-soft px-3 py-2 text-left text-sm font-bold text-primary"
        >
          {question}
        </button>
        {expanded && <p className="mt-3 border-l-2 border-primary pl-3 text-sm">{tip}</p>}
      </PopoverContent>
    </Popover>
  );
}
