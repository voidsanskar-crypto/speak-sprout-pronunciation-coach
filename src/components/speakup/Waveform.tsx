import { useEffect, useRef } from "react";
import type { RecorderStatus } from "@/hooks/use-speech-recorder";

export function Waveform({
  status,
  analyser,
  speaking,
}: {
  status: RecorderStatus;
  analyser: AnalyserNode | null;
  speaking: boolean;
}) {
  const orb = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "listening" || !orb.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const element = orb.current;
    const samples = analyser ? new Uint8Array(analyser.fftSize) : null;
    let frame = 0;
    let level = 0;
    const tick = () => {
      let volume = speaking ? 0.5 : 0;
      if (analyser && samples) {
        analyser.getByteTimeDomainData(samples);
        let energy = 0;
        for (const sample of samples) energy += ((sample - 128) / 128) ** 2;
        volume = Math.min(1, Math.sqrt(energy / samples.length) * 5);
      }
      level += (volume - level) * (volume > level ? 0.26 : 0.12);
      element.style.setProperty("--voice-level", String(level));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      element.style.removeProperty("--voice-level");
    };
  }, [status, analyser, speaking]);

  return (
    <div className="voice-orb" aria-hidden="true" data-status={status} ref={orb}>
      <span className="voice-orb-fill" />
      <span className="voice-orb-ring" />
    </div>
  );
}
