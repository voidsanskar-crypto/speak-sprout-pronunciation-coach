import wave from "@/assets/mascot-wave.png";
import cheer from "@/assets/mascot-cheer.png";
import { cn } from "@/lib/utils";

export function Mascot({
  mood = "wave",
  className,
  eager,
}: {
  mood?: "wave" | "cheer";
  className?: string;
  eager?: boolean;
}) {
  return (
    <img
      src={mood === "cheer" ? cheer : wave}
      alt="Kiki the parrot, your SayTempo coach"
      width={816}
      height={816}
      loading={eager ? "eager" : "lazy"}
      className={cn("pointer-events-none select-none drop-shadow-xl", className)}
    />
  );
}
