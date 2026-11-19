import { Volume2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSpeechRecorder, type SpeechTiming } from "@/hooks/use-speech-recorder";
import { Button } from "@/components/ui/button";
import { MicButton } from "@/components/speakup/MicButton";
import { MicHelp } from "@/components/speakup/MicHelp";
import { speak, canSpeak, stopSpeaking } from "@/lib/speech";
import { scoreBest, type ScoreResult } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export function SpeechPrompt({
  text,
  ipa,
  onScore,
}: {
  text: string;
  ipa?: string | undefined;
  onScore: (result: ScoreResult, timing?: SpeechTiming) => void;
}) {
  const replay = useRef<HTMLAudioElement>(null);
  const recorder = useSpeechRecorder((alts, _clip, timing) =>
    onScore(scoreBest(text, alts), timing),
  );
  useEffect(
    () => () => {
      if (recorder.audioUrl) URL.revokeObjectURL(recorder.audioUrl);
    },
    [recorder.audioUrl],
  );
  useEffect(() => stopSpeaking, []);

  function startRecording() {
    replay.current?.pause();
    void recorder.start();
  }

  return (
    <div className="rounded-[2rem] bg-card p-6 shadow-card">
      <p className="font-display text-2xl font-semibold leading-tight">{text}</p>
      {ipa && <p className="mt-2 text-sm text-muted-foreground">/{ipa}/</p>}
      <div className="mt-5 flex gap-2">
        <Button
          variant="mint"
          size="pill"
          className="flex-1"
          onClick={() => {
            replay.current?.pause();
            if (canSpeak()) speak(text);
          }}
          disabled={recorder.status !== "idle"}
        >
          <Volume2 /> Hear example
        </Button>
      </div>
      {recorder.audioUrl && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-bold text-muted-foreground">Your recording</p>
          <audio
            ref={replay}
            controls
            src={recorder.audioUrl}
            preload="metadata"
            onPlay={stopSpeaking}
            aria-label="Listen to yourself"
            className="h-10 w-full"
          />
        </div>
      )}
      <div className="mt-5 flex min-h-20 flex-col items-center justify-center">
        {recorder.error ? (
          <MicHelp
            error={recorder.error}
            onRetry={() => {
              recorder.clearError();
              startRecording();
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
        <MicButton status={recorder.status} onStart={startRecording} onStop={recorder.stop} />
      </div>
    </div>
  );
}
