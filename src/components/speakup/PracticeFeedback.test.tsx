import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PracticeFeedback } from "./PracticeFeedback";
import type { Phrase } from "@/lib/phrases";
import { scoreTranscript } from "@/lib/scoring";
import * as speech from "@/lib/speech";

describe("practice feedback", () => {
  it("keeps transcript highlights aligned after a hyphenated word", () => {
    const phrase: Phrase = {
      id: "test",
      topic: "interview",
      text: "Lead a cross-functional team.",
      ipa: "lid ə kɹɑsfʌŋkʃənəl tim",
      difficulty: "Advanced",
    };
    render(
      <PracticeFeedback
        phrase={phrase}
        result={scoreTranscript(phrase.text, "lead a cross team")}
        recordingUrl="blob:recording"
        onRetry={() => {}}
        onContinue={() => {}}
        isLast={false}
      />,
    );

    expect(screen.getByRole("button", { name: "cross-functional unmatched" })).toBeVisible();
    expect(screen.getByRole("button", { name: "team. matched" })).toBeVisible();
    const recording = screen.getByLabelText("Your recording");
    expect(recording).toHaveAttribute("controls");

    const playExample = vi.spyOn(speech, "speak").mockImplementation(() => {});
    const pauseRecording = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => {});
    try {
      fireEvent.click(screen.getByRole("button", { name: "Slow example" }));
      expect(pauseRecording).toHaveBeenCalledOnce();
      expect(playExample).toHaveBeenCalledWith(phrase.text, { slow: true });
    } finally {
      playExample.mockRestore();
      pauseRecording.mockRestore();
    }
  });
});
