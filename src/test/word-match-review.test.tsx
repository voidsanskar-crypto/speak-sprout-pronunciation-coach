import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { WordMatchReview } from "@/components/speakup/WordMatchReview";
import { scoreTranscript } from "@/lib/scoring";

vi.mock("@/hooks/use-progress", () => ({
  useProgress: () => ({ translationLanguage: null }),
}));

it("plays the selected IPA sample and shows the matching coaching tip", async () => {
  const played: string[] = [];
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    played.push(this.src);
    return Promise.resolve();
  });
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  try {
    const view = render(<WordMatchReview result={scoreTranscript("think", "sink")} />);
    const theta = screen.getByRole("button", { name: "Hear sound /θ/" });
    expect(theta).toHaveClass("phoneme-difference");
    expect(screen.getAllByRole("button", { name: "Hear sound /ɪ/" })[0]).not.toHaveClass(
      "phoneme-difference",
    );
    fireEvent.click(theta);
    expect(await screen.findByText(/tongue lightly between your teeth/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Hear sound /s/" }));
    expect(await screen.findByText(/tongue behind your front teeth/)).toBeVisible();
    expect(played).toEqual([
      expect.stringMatching(/\/phonemes\/TH\.mp3$/),
      expect.stringMatching(/\/phonemes\/S\.mp3$/),
    ]);
    expect(pause).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(pause).toHaveBeenCalledTimes(2);
  } finally {
    play.mockRestore();
    pause.mockRestore();
  }
});
