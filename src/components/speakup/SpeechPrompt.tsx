import { Volume2 } from "lucide-react";
import { useEffect } from "react";
import { useSpeechRecorder } from "@/hooks/use-speech-recorder";
import { Button } from "@/components/ui/button";
import { MicButton } from "@/components/speakup/MicButton";
import { MicHelp } from "@/components/speakup/MicHelp";
import { speak, canSpeak } from "@/lib/speech";
import { scoreBest, type ScoreResult } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export function SpeechPrompt({
  text,
  ipa,
  onScore,
}: {
  text: string;
  ipa?: string | undefined;
  onScore: (result: ScoreResult) => void;
}) {
  const recorder = useSpeechRecorder((alts) => onScore(scoreBest(text, alts)));
  useEffect(
    () => () => {
      if (recorder.audioUrl) URL.revokeObjectURL(recorder.audioUrl);
    },
    [recorder.audioUrl],
  );
  return (
    <div className="rounded-[2rem] bg-card p-6 shadow-card">
      <p className="font-display text-2xl font-semibold leading-tight">{text}</p>
      {ipa && <p className="mt-2 text-sm text-muted-foreground">/{ipa}/</p>}
      <div className="mt-5 flex gap-2">
        <Button
          variant="mint"
          size="pill"
          className="flex-1"
          onClick={() => canSpeak() && speak(text)}
        >
          <Volume2 /> Hear example
        </Button>
        {recorder.audioUrl && (
          <Button
            variant="soft"
            size="pill"
            className="flex-1"
            onClick={() => void new Audio(recorder.audioUrl!).play()}
          >
            <Volume2 /> Listen to yourself
          </Button>
        )}
      </div>
      <div className="mt-5 flex min-h-20 flex-col items-center justify-center">
        {recorder.error ? (
          <MicHelp
            error={recorder.error}
            onRetry={() => {
              recorder.clearError();
              void recorder.start();
            }}
            onDismiss={recorder.clearError}
          />
        ) : (
          <p
            className={cn(
              "text-center text-sm font-semibold",
              recorder.interim ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {recorder.interim
              ? `“${recorder.interim}”`
              : recorder.status === "listening"
                ? "Listening… speak naturally"
                : "Tap the mic and say the line"}
          </p>
        )}
      </div>
      <div className="flex justify-center">
        <MicButton
          status={recorder.status}
          onStart={() => void recorder.start()}
          onStop={recorder.stop}
        />
      </div>
    </div>
  );
}
