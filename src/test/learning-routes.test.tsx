import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route as EarRoute } from "@/routes/minimal-pairs";
import { Route as ReviewRoute } from "@/routes/review";
import { scoreTranscript, type ScoreResult } from "@/lib/scoring";

const mocks = vi.hoisted(() => ({
  speak: vi.fn(),
  reviewDeckWord: vi.fn(),
  recordTroubleWords: vi.fn(),
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
vi.mock("@/lib/speech", () => ({
  speak: mocks.speak,
  canSpeak: () => true,
  stopSpeaking: vi.fn(),
}));
vi.mock("@/hooks/use-hydrated", () => ({ useHydrated: () => true }));
vi.mock("@/hooks/use-progress", () => ({
  reviewDeckWord: mocks.reviewDeckWord,
  recordTroubleWords: mocks.recordTroubleWords,
  useProgress: () => ({
    reviewDeck: [
      { word: "think", due: "2000-01-01", step: 0 },
      { word: "vest", due: "2000-01-01", step: 0 },
    ],
  }),
}));

beforeEach(() => {
  mocks.speak.mockClear();
  mocks.reviewDeckWord.mockClear();
  mocks.recordTroubleWords.mockClear();
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
    for (const pair of ["sheep/ship", "sink/think", "light/right", "berry/very"]) {
      expect(seen.has(pair)).toBe(true);
    }
  }, 15000);

  it("swaps options independently of the mystery word and forwards speaking results to the deck", () => {
    const Game = EarRoute.options.component!;
    render(<Game />);
    const random = vi.spyOn(Math, "random");
    // The two array shuffles consume 14 draws before the first round is built.
    for (let i = 0; i < 14; i++) random.mockReturnValueOnce(0.999);
    random.mockReturnValueOnce(0.999).mockReturnValueOnce(0).mockReturnValue(0.999);
    try {
      fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    } finally {
      random.mockRestore();
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
});
