import { ExternalLink, MicOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecorderError } from "@/hooks/use-speech-recorder";

export function MicHelp({ error, onRetry, onDismiss }: { error: RecorderError; onRetry: () => void; onDismiss: () => void }) {
  const inFrame = typeof window !== "undefined" && window.self !== window.top;

  if (error.kind !== "permission" && error.kind !== "unsupported" && error.kind !== "no-mic") {
    return (
      <div className="w-full rounded-2xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm font-semibold animate-rise">
        {error.message}
        <button className="ml-2 underline underline-offset-2" onClick={onDismiss}>
          OK
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-danger/30 bg-danger-soft p-5 text-sm animate-rise" role="alert">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger text-destructive-foreground">
          <MicOff className="size-5" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold">
            {error.kind === "unsupported" ? "Speech isn't supported here" : error.kind === "no-mic" ? "No microphone found" : "Microphone is blocked"}
          </p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>

      {error.kind === "permission" && (
        <ol className="mt-4 list-decimal space-y-1.5 pl-5 font-semibold">
          <li>Click the lock or settings icon next to the web address.</li>
          <li>Find <b>Microphone</b> and choose <b>Allow</b>.</li>
          <li>Reload the page, then tap the mic again.</li>
          <li className="text-muted-foreground">
            On iPhone: Settings → Safari → Microphone → Allow. On Android: Chrome → Site settings → Microphone.
          </li>
        </ol>
      )}
      {error.kind === "no-mic" && (
        <p className="mt-3 font-semibold">Plug in a headset or check that no other app is using your microphone.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {error.kind !== "unsupported" && (
          <Button variant="hero" size="pill" onClick={onRetry}>
            <RotateCcw /> Try again
          </Button>
        )}
        {inFrame && (
          <Button variant="soft" size="pill" onClick={() => window.open(window.location.href, "_blank")}>
            <ExternalLink /> Open in new tab
          </Button>
        )}
        <Button variant="ghost" size="pill" className="rounded-full" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
