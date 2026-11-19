import { useEffect, useRef } from "react";

const BARS = 28;

export function Waveform({ active, analyser, speaking }: { active: boolean; analyser: AnalyserNode | null; speaking: boolean }) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const speakingRef = useRef(speaking);
  speakingRef.current = speaking;

  useEffect(() => {
    if (!active) {
      barsRef.current.forEach((b) => b && (b.style.transform = "scaleY(0.12)"));
      return;
    }
    let raf = 0;
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    const tick = (t: number) => {
      if (analyser && data) analyser.getByteFrequencyData(data);
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        let level: number;
        if (analyser && data) {
          const bin = Math.floor(2 + (i / BARS) * (data.length * 0.55));
          level = (data[bin] ?? 0) / 255;
        } else {
          const base = speakingRef.current ? 0.55 : 0.12;
          level = base * (0.5 + 0.5 * Math.abs(Math.sin(t / 180 + i * 0.7))) + Math.random() * (speakingRef.current ? 0.3 : 0.05);
        }
        const centerBoost = 1 - Math.abs(i - BARS / 2) / (BARS / 1.3);
        bar.style.transform = `scaleY(${Math.max(0.1, Math.min(1, level * (0.6 + centerBoost)))})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, analyser]);

  return (
    <div className="flex h-14 items-center justify-center gap-[3px]" aria-hidden>
      {Array.from({ length: BARS }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          className="h-full w-[5px] origin-center rounded-full bg-gradient-hero transition-transform duration-75"
          style={{ transform: "scaleY(0.12)" }}
        />
      ))}
    </div>
  );
}
