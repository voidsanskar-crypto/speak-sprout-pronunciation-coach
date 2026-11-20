import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TimedMission } from "@/components/speakup/TimedMission";
import { Route as DialogueRoute } from "@/routes/dialogue";
import { Route as DailyRoute } from "@/routes/daily-session";
import { Route as SprintRoute } from "@/routes/ear-sprint";
import { DEFAULT_PROGRESS } from "@/lib/progress";
import { Route as EarRoute } from "@/routes/minimal-pairs";
import { Route as ReviewRoute } from "@/routes/review";
import { scoreTranscript, type ScoreResult } from "@/lib/scoring";

const mocks = vi.hoisted(() => ({
  speak: vi.fn(),
  reviewDeckWord: vi.fn(),
  recordTroubleWords: vi.fn(),
  awardXp: vi.fn(),
  groqRoleplay: vi.fn(),
  recordAttempt: vi.fn(),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));
vi.mock("@/components/speakup/MobileShell", () => ({
  MobileShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/speakup/SpeechPrompt", () => ({
  SpeechPrompt: ({ text, onScore }: { text: string; onScore: (score: ScoreResult) => void }) => (
    <div>
      <p>{text}</p>
      <button onClick={() => onScore(scoreTranscript(text, text))}>Mock matching recording</button>
      <button onClick={() => onScore(scoreTranscript(text, "sink"))}>
        Mock unmatched recording
      </button>
    </div>
  ),
}));
vi.mock("@/components/speakup/WordMatchReview", () => ({ WordMatchReview: () => null }));
vi.mock("@/lib/ai/groq.functions", () => ({
  groqRoleplay: mocks.groqRoleplay,
  groqReview: vi.fn(),
}));
vi.mock("@/lib/speech", () => ({
  speak: mocks.speak,
  canSpeak: () => true,
  stopSpeaking: vi.fn(),
}));
vi.mock("@/hooks/use-hydrated", () => ({ useHydrated: () => true }));
vi.mock("@/hooks/use-progress", () => ({
  reviewDeckWord: mocks.reviewDeckWord,
  recordTroubleWords: mocks.recordTroubleWords,
  awardXp: mocks.awardXp,
  recordAttempt: mocks.recordAttempt,
  useProgress: () => sampleProgress,
  getProgressSnapshot: () => sampleProgress,
}));

const sampleProgress = {
  ...DEFAULT_PROGRESS,
  reviewDeck: [
    { word: "think", due: "2000-01-01", step: 0 },
    { word: "vest", due: "2000-01-01", step: 0 },
    { word: "ship", due: "2999-01-01", step: 0 },
  ],
};

beforeEach(() => {
  mocks.speak.mockClear();
  mocks.reviewDeckWord.mockClear();
  mocks.recordTroubleWords.mockClear();
  mocks.awardXp.mockClear();
  mocks.groqRoleplay.mockReset();
  mocks.recordAttempt.mockClear();
});

describe("learning routes", () => {
  it("plays a mystery word and presents both words to record for each of eight pairs", () => {
    const Game = EarRoute.options.component!;
    render(<Game />);
    fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    const seen = new Set<string>();
    for (let index = 0; index < 8; index++) {
      const options = screen.getAllByRole("button").filter((button) => button.hasAttribute("lang"));
      const pair = options.map((button) => button.getAttribute("aria-label")!);
      seen.add([...pair].sort().join("/"));
      expect(options.every((button) => button.hasAttribute("disabled"))).toBe(true);
      fireEvent.click(screen.getByRole("button", { name: "Play mystery word" }));
      const mystery = mocks.speak.mock.lastCall?.[0] as string;
      fireEvent.click(screen.getByRole("button", { name: mystery }));
      fireEvent.click(screen.getByRole("button", { name: "Record both words" }));
      expect(screen.getByText(pair[0]!, { exact: true })).toBeVisible();
      expect(screen.getByRole("complementary", { name: "Mouth-position tip" })).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: "Mock matching recording" }));
      expect(screen.getByText("Browser transcript:", { exact: false })).toHaveTextContent(pair[0]!);
      fireEvent.click(screen.getByRole("button", { name: "Next word" }));
      expect(screen.getByText(pair[1]!, { exact: true })).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: "Mock matching recording" }));
      expect(screen.getByText("Browser transcript:", { exact: false })).toHaveTextContent(pair[1]!);
      fireEvent.click(
        screen.getByRole("button", { name: index === 7 ? "See results" : "Next pair" }),
      );
    }
    expect(screen.getByText("8/8")).toBeVisible();
    expect(seen.size).toBe(8);
  }, 15000);

  it("swaps options independently of the mystery word and forwards speaking results to the deck", () => {
    const Game = EarRoute.options.component!;
    render(<Game />);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(1970, 0, 1, 12));
    const random = vi.spyOn(Math, "random");
    // Leave the daily catalog order unchanged, then pick opposite positions for the first round.
    for (let i = 0; i < 7; i++) random.mockReturnValueOnce(0.999);
    random.mockReturnValueOnce(0.999).mockReturnValueOnce(0).mockReturnValue(0.999);
    try {
      fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    } finally {
      random.mockRestore();
      vi.useRealTimers();
    }
    const options = screen.getAllByRole("button").filter((button) => button.hasAttribute("lang"));
    expect(options.map((button) => button.getAttribute("aria-label"))).toEqual(["ship", "sheep"]);
    fireEvent.click(screen.getByRole("button", { name: "Play mystery word" }));
    expect(mocks.speak.mock.lastCall?.[0]).toBe("sheep");
    fireEvent.click(screen.getByRole("button", { name: "sheep" }));
    fireEvent.click(screen.getByRole("button", { name: "Record both words" }));
    fireEvent.click(screen.getByRole("button", { name: "Mock unmatched recording" }));
    expect(mocks.recordTroubleWords).toHaveBeenLastCalledWith(
      scoreTranscript("ship", "sink").words,
    );
  });

  it("can continue to the next pair in a 16-round listening-only session", () => {
    const Game = EarRoute.options.component!;
    render(<Game />);
    fireEvent.change(screen.getByLabelText("Session length"), { target: { value: "16" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Listening only" }));
    fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    expect(screen.getByText("Pair 1 of 16")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Play mystery word" }));
    fireEvent.click(screen.getByRole("button", { name: mocks.speak.mock.lastCall?.[0] as string }));
    fireEvent.click(screen.getByRole("button", { name: "Next pair" }));
    expect(screen.getByText("Pair 2 of 16")).toBeVisible();
  });

  it("starts a new preset with a matching role, opener, and checkpoints", async () => {
    const Dialogue = DialogueRoute.options.component!;
    mocks.groqRoleplay.mockResolvedValue({ ok: true, reply: "Do you have your receipt?" });
    render(<Dialogue />);
    expect(screen.getByRole("button", { name: /Negotiate a deadline/ })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Create your scenario" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Return a purchase/ }));
    expect(screen.getByText("Hi. How can I help you with your purchase today?")).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Your response" }), {
      target: { value: "I’d like to return this. It’s broken." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send response" }));
    expect(await screen.findByText("Do you have your receipt?")).toBeVisible();
    expect(mocks.groqRoleplay).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: "Store associate",
        history: expect.arrayContaining([expect.objectContaining({ role: "assistant" })]),
      }),
    });
    const checklist = within(screen.getByRole("region", { name: "Conversation checkpoints" }));
    expect(checklist.getAllByText("Completed:").length).toBe(2);
  });

  it("shows a mission briefing before starting and checks off the current objective", () => {
    render(<TimedMission scenario="coffee" />);
    const ticket = within(screen.getByRole("complementary", { name: "Order ticket" }));
    expect(ticket.getByText("Sandwich + latte")).toBeVisible();
    expect(screen.getByRole("timer")).toHaveTextContent("45s limit");
    fireEvent.click(screen.getByRole("button", { name: "Start mission" }));
    expect(screen.getByRole("timer")).toHaveTextContent("45s left");
    expect(ticket.getByText("Order the sandwich and latte")).toHaveAttribute(
      "aria-current",
      "step",
    );
    const input = screen.getByRole("textbox", { name: "Type your reply" });
    fireEvent.change(input, { target: { value: "I’d like a sandwich and a latte." } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("Whole milk or oat?")).toBeVisible();
    expect(ticket.getByText("Choose your milk")).toHaveAttribute("aria-current", "step");
  });

  it("only saves a green deck review after an actual word match", () => {
    const Deck = ReviewRoute.options.component!;
    const { container } = render(<Deck />);
    expect(container.querySelector(".review-stack")).toHaveAttribute("data-layered", "true");
    fireEvent.click(screen.getByRole("button", { name: "Reveal word" }));
    expect(screen.queryByRole("button", { name: "Save green review" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mock unmatched recording" }));
    expect(screen.queryByRole("button", { name: "Save green review" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review tomorrow" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Mock matching recording" }));
    fireEvent.click(screen.getByRole("button", { name: "Save green review" }));
    expect(mocks.reviewDeckWord).toHaveBeenCalledWith("think", true);
    expect(container.querySelector(".review-card-exit")).toHaveTextContent("think");
  });

  it("walks through two due words, three scored phrases, and one listening round", async () => {
    const Daily = DailyRoute.options.component!;
    render(<Daily />);
    expect(await screen.findByText("Step 1 of 6")).toBeVisible();
    for (const word of ["think", "vest"]) {
      expect(screen.getByText(word, { exact: true })).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: "Mock matching recording" }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(mocks.reviewDeckWord).toHaveBeenLastCalledWith(word, true);
    }
    for (let i = 0; i < 3; i++) {
      expect(screen.getByRole("heading", { name: "Practice a target phrase" })).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: "Mock matching recording" }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    }
    expect(mocks.recordAttempt).toHaveBeenCalledTimes(3);
    fireEvent.click(screen.getByRole("button", { name: "Play mystery word" }));
    fireEvent.click(screen.getByRole("button", { name: mocks.speak.mock.lastCall?.[0] as string }));
    fireEvent.click(screen.getByRole("button", { name: "Finish session" }));
    expect(screen.getByText("6 of 6 activities practiced.")).toBeVisible();
  });

  it("awards Ear Sprint combo XP once per round and expires the sprint at 60 seconds", () => {
    const Sprint = SprintRoute.options.component!;
    vi.useFakeTimers({
      toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "performance"],
    });
    let player: HTMLMediaElement | undefined;
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      player = this;
      return Promise.resolve();
    });
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const view = render(<Sprint />);
    try {
      fireEvent.click(screen.getByRole("button", { name: "Start 60-second sprint" }));
      for (let round = 0; round < 3; round++) {
        const word = player?.src.split("/").at(-1)?.replace(".mp3", "") ?? "";
        const option = screen.getByRole("button", { name: word });
        expect(option).toBeDisabled();
        fireEvent.ended(player!);
        fireEvent.click(option);
        fireEvent.click(option);
        act(() => vi.advanceTimersByTime(360));
      }
      expect(mocks.awardXp.mock.calls).toEqual([[10], [20], [40]]);
      fireEvent.ended(player!);
      act(() => vi.advanceTimersByTime(3100));
      expect(screen.getByText("0 in a row")).toBeVisible();
      act(() => vi.advanceTimersByTime(60_000));
      expect(screen.getByText("Sprint finished")).toBeVisible();
      expect(screen.getByText(/Best combo: 3/)).toBeVisible();
    } finally {
      view.unmount();
      vi.useRealTimers();
      play.mockRestore();
      pause.mockRestore();
    }
  });
});
