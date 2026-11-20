import { Loader2, Mic, Square } from "lucide-react";
import { useEffect, useRef } from "react";
import type { RecorderStatus } from "@/hooks/use-speech-recorder";

type MicButtonProps = {
  status: RecorderStatus;
  analyser?: AnalyserNode | null;
  speaking?: boolean;
  onStart: () => void;
  onStop: () => void;
};

export function MicButton({ status, analyser, speaking = false, onStart, onStop }: MicButtonProps) {
  const listening = status === "listening";
  const busy = status === "requesting" || status === "processing";
  const orb = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "listening" || !orb.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const element = orb.current;
    if (!analyser) {
      element.style.setProperty("--voice-level", speaking ? "0.5" : "0");
      return () => {
        element.style.removeProperty("--voice-level");
      };
    }
    const samples = new Uint8Array(analyser.fftSize);
    let frame = 0;
    let level = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(samples);
      let energy = 0;
      for (const sample of samples) energy += ((sample - 128) / 128) ** 2;
      const volume = Math.min(1, Math.sqrt(energy / samples.length) * 5);
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
    <div className="voice-orb" data-status={status} ref={orb}>
      <span aria-hidden="true" className="voice-orb-halo" />
      <span aria-hidden="true" className="voice-orb-sonar" />
      <span aria-hidden="true" className="voice-orb-sonar" />
      <span aria-hidden="true" className="voice-orb-analysis" />
      <button
        type="button"
        onClick={listening ? onStop : onStart}
        disabled={busy}
        aria-label={
          status === "processing"
            ? "Analyzing recording"
            : status === "requesting"
              ? "Getting the microphone ready"
              : listening
                ? "Stop recording"
                : "Tap to speak"
        }
        className="voice-orb-button"
      >
        {busy ? (
          <Loader2 aria-hidden="true" className="size-7 motion-safe:animate-spin" />
        ) : listening ? (
          <Square aria-hidden="true" className="size-7 fill-current" />
        ) : (
          <Mic aria-hidden="true" className="size-9" />
        )}
      </button>
    </div>
  );
}
