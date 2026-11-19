import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ScoreGauge } from "@/components/speakup/ScoreGauge";
import { Waveform } from "@/components/speakup/Waveform";

afterEach(() => vi.restoreAllMocks());

it("moves the score from zero to its target over 800 ms", () => {
  let frame: FrameRequestCallback | undefined;
  vi.spyOn(performance, "now").mockReturnValue(0);
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((tick) => {
    frame = tick;
    return 1;
  });
  const view = render(<ScoreGauge score={82} />);
  const ring = view.container.querySelector("circle[stroke-dashoffset]")!;
  const initial = Number(ring.getAttribute("stroke-dashoffset"));
  act(() => frame?.(400));
  const midway = Number(ring.getAttribute("stroke-dashoffset"));
  expect(midway).toBeLessThan(initial);
  expect(midway).toBeGreaterThan(initial * 0.18);
  act(() => frame?.(800));
  expect(Number(ring.getAttribute("stroke-dashoffset"))).toBeCloseTo(initial * 0.18);
  expect(screen.getByText("82%", { selector: ".sr-only" })).toBeInTheDocument();
});

it("responds to louder samples and switches to the analysis ring", () => {
  let frame: FrameRequestCallback | undefined;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((tick) => {
    frame = tick;
    return 1;
  });
  let sample = 128;
  const analyser = {
    fftSize: 16,
    getByteTimeDomainData: (data: Uint8Array) => {
      data.fill(sample);
    },
  } as AnalyserNode;
  const view = render(<Waveform status="listening" analyser={analyser} speaking={false} />);
  const orb = view.container.querySelector<HTMLElement>(".voice-orb")!;
  act(() => frame?.(0));
  expect(orb.style.getPropertyValue("--voice-level")).toBe("0");
  sample = 166;
  act(() => frame?.(16));
  expect(Number(orb.style.getPropertyValue("--voice-level"))).toBeGreaterThan(0);
  view.rerender(<Waveform status="processing" analyser={null} speaking={false} />);
  expect(orb).toHaveAttribute("data-status", "processing");
  expect(orb.style.getPropertyValue("--voice-level")).toBe("");
});
