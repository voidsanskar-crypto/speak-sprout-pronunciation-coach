type Turn = {
  objective: string;
  prompt: string;
  hint: string;
  accepts: (input: string) => boolean;
};

export const timedMissions = {
  coffee: {
    title: "Coffee Shop Rush",
    speaker: "Barista",
    panel: {
      title: "Order ticket",
      details: [
        { label: "Breakfast", value: "Sandwich + latte" },
        { label: "Milk", value: "Oat" },
        { label: "Service", value: "To go" },
      ],
    },
    goal: "Order a breakfast sandwich and a latte. Ask for oat milk and take it to go.",
    seconds: 45,
    success: "A breakfast sandwich and an oat latte to go. You made it!",
    turns: [
      {
        objective: "Order the sandwich and latte",
        prompt: "Morning! What can I get you?",
        hint: "Try: I’d like a breakfast sandwich and a latte, please.",
        accepts: (text) => /\bsandwich\b/.test(text) && /\blatte\b/.test(text),
      },
      {
        objective: "Choose your milk",
        prompt: "Whole milk or oat?",
        hint: "Try: Oat milk, please.",
        accepts: (text) => /\boats?\b/.test(text) && !/\b(?:no|not) oats?\b/.test(text),
      },
      {
        objective: "Say how you’ll take the order",
        prompt: "To stay or to go?",
        hint: "Try: To go, please.",
        accepts: (text) =>
          /\b(?:to go|takeaway|take away|takeout|take out)\b/.test(text) &&
          !/\b(?:no|not) to go\b/.test(text),
      },
    ] satisfies Turn[],
  },
  subway: {
    title: "Subway Gate Emergency",
    speaker: "Station agent",
    panel: {
      title: "Departure board",
      details: [
        { label: "Line", value: "Blue Line" },
        { label: "Destination", value: "Riverside" },
        { label: "Service", value: "Boarding now" },
      ],
    },
    goal: "Find the terminal for the Blue Line to Riverside. Confirm the entrance before departure.",
    seconds: 40,
    success: "Entrance B, Terminal 2. Go down the stairs on your left. You’re just in time!",
    turns: [
      {
        objective: "Ask where the Blue Line boards",
        prompt: "Next departure boarding now. Can I help you?",
        hint: "Try: Where is the terminal for the Blue Line to Riverside?",
        accepts: (text) =>
          /\b(?:where|how|which|direct|directions|find|looking)\b/.test(text) &&
          /\b(?:blue|riverside)\b/.test(text),
      },
      {
        objective: "Confirm your stop",
        prompt: "That train boards at Terminal 2. Which stop are you headed to?",
        hint: "Try: I’m going to Riverside.",
        accepts: (text) => /\briver[ -]?side\b/.test(text),
      },
      {
        objective: "Confirm the entrance",
        prompt: "That’s the right train. The entrance is B. Anything else?",
        hint: "Try: Is entrance B the fastest way to Terminal 2?",
        accepts: (text) =>
          /\b(?:entrance|gate) (?:b|bee)\b/.test(text) &&
          /\b(?:is|confirm|terminal|enter|use|go)\b/.test(text),
      },
    ] satisfies Turn[],
  },
} as const;

export type TimedScenario = keyof typeof timedMissions;
export function isTimedScenario(value: unknown): value is TimedScenario {
  return typeof value === "string" && Object.hasOwn(timedMissions, value);
}
