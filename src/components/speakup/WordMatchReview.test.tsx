import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WordMatchReview } from "./WordMatchReview";
import { scoreTranscript } from "@/lib/scoring";

const preferences = vi.hoisted(() => ({
  language: null as string | null,
  translations: vi.fn(),
}));
vi.mock("@/hooks/use-progress", () => ({
  useProgress: () => ({ translationLanguage: preferences.language }),
}));
vi.mock("@/hooks/use-translations", () => ({
  useTextTranslations: preferences.translations,
}));

beforeEach(() => {
  preferences.language = null;
  preferences.translations.mockReset();
});

describe("word match review", () => {
  it("marks the different characters, identifies extra words, and replays the target", () => {
    const onReplay = vi.fn();
    const { container } = render(
      <WordMatchReview
        result={scoreTranscript("I think so", "I really sink so")}
        onReplay={onReplay}
      />,
    );
    expect(Array.from(container.querySelectorAll("mark"), (mark) => mark.textContent)).toEqual([
      "t",
      "h",
      "s",
    ]);
    expect(screen.getByText("really")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Listen: think" }));
    expect(onReplay).toHaveBeenCalledWith("think");
  });

  it("uses the chosen language for guidance and keeps the review English words local", async () => {
    preferences.language = "Spanish";
    preferences.translations.mockReturnValue({
      data: {
        "word-review:v1:heading": "Palabras para repasar",
        "word-review:v1:expected": "Palabra esperada",
        "word-review:v1:heard": "Palabra reconocida",
      },
    });
    render(<WordMatchReview result={scoreTranscript("I think so", "I sink so")} />);
    expect(screen.getByRole("heading", { name: "Palabras para repasar" })).toBeVisible();
    expect(await screen.findByText("Dictionary sound contrast")).toBeVisible();
    expect(screen.getAllByText("Palabra esperada")).toHaveLength(2);
    const call = preferences.translations.mock.calls[0];
    expect(call?.[1]).toBe("Spanish");
    expect(JSON.stringify(call?.[0])).not.toMatch(/\b(?:think|sink)\b/);
  });

  it("keeps the review available if translations fail", () => {
    preferences.language = "Hindi";
    preferences.translations.mockReturnValue({ isError: true });
    render(<WordMatchReview result={scoreTranscript("I think so", "I sink so")} />);
    expect(screen.getByRole("heading", { name: "Words to review" })).toBeVisible();
    expect(screen.getByText(/Translation is unavailable/)).toBeVisible();
  });
});
