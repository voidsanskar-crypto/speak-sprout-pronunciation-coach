import { useCallback, useEffect, useRef, useState } from "react";
import type { CoachedSound } from "@/lib/phonemes";
import { stopSpeaking } from "@/lib/speech";

export function usePhonemeAudio() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState(false);

  const stop = useCallback(() => {
    const previous = audio.current;
    audio.current = null;
    previous?.pause();
  }, []);

  useEffect(() => stop, [stop]);

  function play(phone: CoachedSound) {
    stopSpeaking();
    stop();
    setAudioError(false);
    const sample = new Audio(`${import.meta.env.BASE_URL}phonemes/${phone}.mp3`);
    audio.current = sample;
    void sample.play().catch(() => {
      if (audio.current === sample) setAudioError(true);
    });
  }

  return { play, stop, audioError };
}
