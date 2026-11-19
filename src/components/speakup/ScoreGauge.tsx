import { useEffect, useState } from "react";
import { Ring } from "./Ring";
import { scoreLabel } from "@/lib/scoring";

export function scoreTone(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 55) return "text-warning";
  return "text-danger";
}

export function ScoreGauge({ score, caption = "word match" }: { score: number; caption?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(score);
      return;
    }
    let raf = 0;
    const startT = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startT) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="flex flex-col items-center">
      <Ring
        value={shown / 100}
        size={144}
        stroke={12}
        barClassName={scoreTone(score)}
        trackClassName="text-muted"
      >
        <span className="font-display text-5xl font-bold leading-none" aria-hidden="true">
          {shown}
          <span className="text-xl">%</span>
        </span>
        <span className="sr-only">{score}%</span>
        <span className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {caption}
        </span>
      </Ring>
      <p className={`mt-2 font-display text-xl font-semibold ${scoreTone(score)}`}>
        {scoreLabel(score)}
      </p>
    </div>
  );
}
