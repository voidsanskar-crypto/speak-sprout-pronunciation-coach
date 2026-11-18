import { useEffect, useState } from "react";
import { Ring } from "./Ring";
import { scoreLabel } from "@/lib/scoring";

export function scoreTone(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 55) return "text-warning";
  return "text-danger";
}

export function ScoreGauge({ score }: { score: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
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
    <div className="flex flex-col items-center animate-pop-in">
      <Ring value={shown / 100} size={190} stroke={16} barClassName={scoreTone(score)} trackClassName="text-muted">
        <span className="font-display text-6xl font-bold leading-none">{shown}</span>
        <span className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">score</span>
      </Ring>
      <p className={`mt-3 font-display text-2xl font-semibold ${scoreTone(score)}`}>{scoreLabel(score)}</p>
    </div>
  );
}
