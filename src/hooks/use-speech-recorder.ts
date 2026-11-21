import { useCallback, useEffect, useRef, useState } from "react";
import { getRecognitionCtor, stopSpeaking, type SpeechRecognitionLike } from "@/lib/speech";

export type RecorderStatus = "idle" | "requesting" | "listening" | "processing";
export type RecorderErrorKind =
  "permission" | "unsupported" | "no-speech" | "no-mic" | "network" | "other";

export type SpeechTiming = { speakingMs: number | null };

export interface RecorderError {
  kind: RecorderErrorKind;
  message: string;
}

const MAX_LISTEN_MS = 12000;

function isAndroid() {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

export function useSpeechRecorder(
  onResult: (alternatives: string[], recordingUrl?: string, timing?: SpeechTiming) => void,
  { captureAudio = true, onReady }: { captureAudio?: boolean; onReady?: () => void } = {},
) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<RecorderError | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const finishRecordingRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const cleanupAudio = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setAnalyser(null);
    setSpeaking(false);
  }, []);

  const discardMediaRecording = useCallback(() => {
    const media = mediaRecorderRef.current;
    if (media) {
      media.onstop = null;
      media.ondataavailable = null;
      if (media.state === "recording") media.stop();
      mediaRecorderRef.current = null;
    }
    audioChunksRef.current = [];
    finishRecordingRef.current = null;
  }, []);

  useEffect(
    () => () => {
      generation.current++;
      const recorder = recRef.current;
      recRef.current = null;
      recorder?.abort();
      discardMediaRecording();
      cleanupAudio();
    },
    [cleanupAudio, discardMediaRecording],
  );

  const start = useCallback(async () => {
    if (status !== "idle") return;
    const attempt = ++generation.current;
    setError(null);
    setInterim("");
    setAudioUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    audioUrlRef.current = null;
    stopSpeaking();

    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError({
        kind: "unsupported",
        message:
          "Your browser can't recognise speech. Please open SayTempo in Chrome, Edge or Safari.",
      });
      return;
    }

    setStatus("requesting");

    // Live waveform via the mic stream (skipped on Android, where it can block recognition).
    if (captureAudio && navigator.mediaDevices?.getUserMedia && !isAndroid()) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (generation.current !== attempt) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (typeof MediaRecorder !== "undefined") {
          audioChunksRef.current = [];
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size) audioChunksRef.current.push(event.data);
          };
          mediaRecorder.onstop = () => {
            if (audioChunksRef.current.length) {
              const blob = new Blob(audioChunksRef.current, {
                type: mediaRecorder.mimeType || "audio/webm",
              });
              audioUrlRef.current = URL.createObjectURL(blob);
              setAudioUrl((previous) => {
                if (previous) URL.revokeObjectURL(previous);
                return audioUrlRef.current;
              });
            }
            audioChunksRef.current = [];
            mediaRecorderRef.current = null;
            finishRecordingRef.current?.();
            finishRecordingRef.current = null;
          };
          mediaRecorder.start();
        }
        const AC =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const src = ctx.createMediaStreamSource(stream);
        const node = ctx.createAnalyser();
        node.fftSize = 256;
        node.smoothingTimeConstant = 0.75;
        src.connect(node);
        ctxRef.current = ctx;
        setAnalyser(node);
      } catch (e) {
        if (generation.current !== attempt) return;
        const name = (e as DOMException)?.name;
        if (name === "NotAllowedError" || name === "SecurityError") {
          setStatus("idle");
          setError({ kind: "permission", message: "Microphone access was blocked." });
          return;
        }
        if (name === "NotFoundError") {
          setStatus("idle");
          setError({ kind: "no-mic", message: "We couldn't find a microphone on this device." });
          return;
        }
        // Other failures: continue without the real waveform.
      }
    }

    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    recRef.current = rec;
    rec.onstart = () => { if (recRef.current === rec) onReady?.(); };

    let finals: string[] = [];
    let latest = "";
    let failed = false;

    let firstSpeech: number | null = null;
    let lastSpeech: number | null = null;
    rec.onspeechstart = () => {
      firstSpeech ??= performance.now();
      setSpeaking(true);
    };
    rec.onspeechend = () => {
      lastSpeech = performance.now();
      setSpeaking(false);
    };
    rec.onresult = (e) => {
      let text = "";
      const alts: string[] = [];
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r) continue;
        text += r[0]?.transcript ?? "";
        if (r.isFinal) {
          for (let k = 0; k < r.length; k++) {
            const alt = r[k];
            if (alt) alts.push(alt.transcript);
          }
        }
      }
      latest = text.trim();
      setInterim(latest);
      setSpeaking(true);
      if (alts.length) finals = alts.map((a) => a.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      failed = true;
      const map: Record<string, RecorderError> = {
        "not-allowed": { kind: "permission", message: "Microphone access was blocked." },
        "service-not-allowed": {
          kind: "permission",
          message: "Speech recognition isn't allowed here.",
        },
        "no-speech": {
          kind: "no-speech",
          message: "We didn't hear anything. Tap the mic and speak clearly.",
        },
        "audio-capture": {
          kind: "no-mic",
          message: "We couldn't access a microphone on this device.",
        },
        network: {
          kind: "network",
          message:
            "Speech recognition needs an internet connection. Check your connection and try again.",
        },
      };
      setError(
        map[e.error] ?? {
          kind: "other",
          message: "Something went wrong while listening. Please try again.",
        },
      );
    };
    rec.onend = () => {
      if (recRef.current !== rec) return;
      const needsMediaStop = mediaRecorderRef.current?.state === "recording";
      const alternatives = finals.length ? finals : latest ? [latest] : [];
      const finish = () => {
        if (recRef.current !== rec) return;
        cleanupAudio();
        recRef.current = null;
        if (alternatives.length && !(failed && !latest)) {
          setStatus("processing");
          setError(null);
          onResultRef.current(alternatives, audioUrlRef.current ?? undefined, {
            speakingMs:
              firstSpeech !== null && lastSpeech !== null && lastSpeech > firstSpeech
                ? lastSpeech - firstSpeech
                : null,
          });
          setStatus("idle");
        } else {
          if (!failed) {
            setError({
              kind: "no-speech",
              message: "We didn't hear anything. Tap the mic and speak clearly.",
            });
          }
          setStatus("idle");
        }
      };
      if (needsMediaStop) {
        finishRecordingRef.current = finish;
        mediaRecorderRef.current?.stop();
      } else finish();
    };

    try {
      rec.start();
      setStatus("listening");
      timerRef.current = setTimeout(() => rec.stop(), MAX_LISTEN_MS);
    } catch {
      cleanupAudio();
      setStatus("idle");
      setError({ kind: "other", message: "Couldn't start listening. Please try again." });
    }
  }, [status, cleanupAudio, captureAudio, onReady]);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    generation.current++;
    const recorder = recRef.current;
    recRef.current = null;
    recorder?.abort();
    discardMediaRecording();
    cleanupAudio();
    setStatus("idle");
    setInterim("");
  }, [cleanupAudio, discardMediaRecording]);

  const clearError = useCallback(() => setError(null), []);

  return { status, interim, error, analyser, speaking, audioUrl, start, stop, cancel, clearError };
}
