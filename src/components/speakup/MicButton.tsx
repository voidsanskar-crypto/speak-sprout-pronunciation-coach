import { Loader2, Mic, Square } from "lucide-react";
import type { RecorderStatus } from "@/hooks/use-speech-recorder";
import { cn } from "@/lib/utils";

export function MicButton({ status, onStart, onStop }: { status: RecorderStatus; onStart: () => void; onStop: () => void }) {
  const listening = status === "listening";
  const busy = status === "requesting" || status === "processing";
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <span aria-hidden="true" className={cn("absolute inset-0 rounded-full bg-primary/15 blur-xl transition-opacity", listening ? "opacity-100" : "opacity-50")} />
      {listening && (
        <>
          <span className="absolute inset-2 rounded-full bg-primary/40 animate-pulse-ring" />
          <span className="absolute inset-2 rounded-full bg-primary/30 animate-pulse-ring [animation-delay:0.6s]" />
        </>
      )}
      <button
        type="button"
        onClick={listening ? onStop : onStart}
        disabled={busy}
        aria-label={listening ? "Stop recording" : "Tap to speak"}
        className={cn(
          "relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground tactile-btn ring-4 ring-card transition-transform active:scale-95 disabled:opacity-80",
          listening && "scale-105",
        )}
      >
        {busy ? <Loader2 className="size-9 animate-spin" /> : listening ? <Square className="size-8 fill-current" /> : <Mic className="size-10" />}
      </button>
    </div>
  );
}
