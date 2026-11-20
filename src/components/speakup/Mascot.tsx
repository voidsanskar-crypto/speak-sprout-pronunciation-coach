import waveSmall from "@/assets/mascot-wave-256.webp";
import waveLarge from "@/assets/mascot-wave-512.webp";
import cheerSmall from "@/assets/mascot-cheer-256.webp";
import cheerLarge from "@/assets/mascot-cheer-512.webp";
import { cn } from "@/lib/utils";

export function Mascot({
  mood = "wave",
  className,
  eager,
  sizes = "192px",
}: {
  mood?: "wave" | "cheer";
  className?: string;
  eager?: boolean;
  sizes?: string;
}) {
  const [small, large] = mood === "cheer" ? [cheerSmall, cheerLarge] : [waveSmall, waveLarge];
  return (
    <img
      src={small}
      srcSet={`${small} 256w, ${large} 512w`}
      sizes={sizes}
      alt="Kiki the parrot, your SayTempo coach"
      width={256}
      height={256}
      loading={eager ? "eager" : "lazy"}
      className={cn("pointer-events-none select-none drop-shadow-xl", className)}
    />
  );
}
