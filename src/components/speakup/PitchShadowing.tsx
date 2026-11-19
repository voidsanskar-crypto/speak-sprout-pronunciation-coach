import { AudioLines, Mic, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import data from "@/lib/data/shadow-pitch.json";
import { estimatePitch, relativePitch, type PitchSample } from "@/lib/pitch";
import { stopSpeaking } from "@/lib/speech";

const references: Record<string, number[]> = data;
const frameSeconds = 0.06;

export function PitchShadowing({ phraseId, disabled }: { phraseId: string; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"idle" | "requesting" | "recording">("idle");
  const [heard, setHeard] = useState<PitchSample[]>([]);
  const [error, setError] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  const capture = useRef<{ frame: number; context: AudioContext; stream: MediaStream } | null>(
    null,
  );
  const request = useRef(0);
  const values = references[phraseId];
  const target =
    values?.map((hz, index): PitchSample => ({ hz: hz || null, time: index * frameSeconds })) ?? [];
  const targetLength = (values?.length ?? 1) * frameSeconds;
  const chartLength = Math.max(targetLength, heard.at(-1)?.time ?? 0);

  function release() {
    request.current++;
    const session = capture.current;
    if (!session) return;
    capture.current = null;
    cancelAnimationFrame(session.frame);
    session.stream.getTracks().forEach((track) => track.stop());
    void session.context.close().catch(() => {});
  }

  function stop() {
    release();
    setMode("idle");
  }

  useEffect(
    () => () => {
      audio.current?.pause();
      release();
    },
    [],
  );

  useEffect(() => {
    if (!disabled) return;
    audio.current?.pause();
    stop();
  }, [disabled]);

  function listen() {
    stopSpeaking();
    audio.current?.pause();
    setError("");
    const player = new Audio(`${import.meta.env.BASE_URL}shadowing/${phraseId}.mp3`);
    audio.current = player;
    void player.play().catch(() => {
      if (audio.current === player) setError("Couldn’t play the target example.");
    });
  }

  async function start() {
    audio.current?.pause();
    stopSpeaking();
    setHeard([]);
    setError("");
    const Context =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!navigator.mediaDevices?.getUserMedia || !Context) {
      setError("This browser doesn’t provide live pitch capture.");
      return;
    }
    setMode("requesting");
    const id = ++request.current;
    let context: AudioContext | undefined;
    let stream: MediaStream | undefined;
    try {
      context = new Context();
      await context.resume();
      stream = await navigator.mediaDevices.getUserMedia({ audio: { autoGainControl: false } });
      if (request.current !== id) {
        stream.getTracks().forEach((track) => track.stop());
        await context.close();
        return;
      }
      const node = context.createAnalyser();
      node.fftSize = 2048;
      context.createMediaStreamSource(stream).connect(node);
      const buffer = new Float32Array(node.fftSize);
      const session = { context, stream, frame: 0 };
      capture.current = session;
      let firstVoiced: number | null = null;
      let last = 0;
      const started = performance.now();
      const samples: PitchSample[] = [];
      function tick(now: number) {
        if (request.current !== id) return;
        if (now - started > Math.max(14, targetLength + 5) * 1000) {
          if (firstVoiced === null)
            setError("No clear voiced pitch was detected. Try again closer to your mic.");
          stop();
          return;
        }
        if (now - last >= frameSeconds * 1000) {
          last = now;
          node.getFloatTimeDomainData(buffer);
          const hz = estimatePitch(buffer, session.context.sampleRate);
          if (hz !== null && firstVoiced === null) firstVoiced = now;
          if (firstVoiced !== null) {
            samples.push({ time: (now - firstVoiced) / 1000, hz });
            setHeard([...samples]);
          }
        }
        session.frame = requestAnimationFrame(tick);
      }
      setMode("recording");
      session.frame = requestAnimationFrame(tick);
    } catch {
      stream?.getTracks().forEach((track) => track.stop());
      void context?.close().catch(() => {});
      if (request.current === id) {
        setMode("idle");
        setError("Couldn’t read the microphone. Check access and try again.");
      }
    }
  }

  if (!target.length) return null;
  return (
    <section className="mt-4 w-full rounded-2xl border border-border bg-card p-4">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-1"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            audio.current?.pause();
            stop();
          }
          setOpen(!open);
        }}
      >
        <AudioLines aria-hidden="true" /> Pitch shadowing
      </Button>
      {open && (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            Listen to the synthetic example, then copy its rises and falls. Each line uses your own
            pitch or the example’s pitch as its midpoint.
          </p>
          <PitchLine
            label="Target melody"
            samples={target}
            duration={chartLength}
            color="text-primary"
          />
          <PitchLine
            label="Your melody"
            samples={heard}
            duration={chartLength}
            color="text-flame"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="soft"
              onClick={listen}
              disabled={disabled || mode !== "idle"}
            >
              <Volume2 aria-hidden="true" /> Hear target
            </Button>
            <Button
              type="button"
              size="sm"
              variant="hero"
              disabled={disabled || mode === "requesting"}
              onClick={() => {
                if (mode === "recording") {
                  if (!heard.length) setError("No clear voiced pitch was detected.");
                  stop();
                } else void start();
              }}
            >
              {mode === "recording" ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
              {mode === "recording"
                ? "Stop shadowing"
                : mode === "requesting"
                  ? "Getting mic ready…"
                  : "Record my pitch"}
            </Button>
          </div>
          {error && (
            <p role="status" className="mt-2 text-xs text-danger">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function PitchLine({
  label,
  samples,
  duration,
  color,
}: {
  label: string;
  samples: PitchSample[];
  duration: number;
  color: string;
}) {
  let previous: { x: number; y: number } | null = null;
  const path = relativePitch(samples)
    .map(({ time, semitones }) => {
      if (semitones === null) {
        previous = null;
        return "";
      }
      const x = 5 + (390 * time) / duration;
      const y = 35 - 3.5 * Math.max(-8, Math.min(8, semitones));
      const segment: string = previous
        ? `C ${(previous.x + x) / 2} ${previous.y} ${(previous.x + x) / 2} ${y} ${x} ${y}`
        : `M ${x} ${y}`;
      previous = { x, y };
      return segment;
    })
    .join(" ");

  return (
    <figure className="mt-3">
      <figcaption className="text-xs font-bold">{label}</figcaption>
      <svg
        viewBox="0 0 400 70"
        preserveAspectRatio="none"
        className={`mt-1 h-16 w-full rounded-lg bg-muted ${color}`}
        aria-hidden="true"
      >
        <path
          d="M 5 35 H 395"
          stroke="currentColor"
          strokeWidth="1"
          opacity=".25"
          strokeDasharray="5 4"
        />
        <path
          d={path}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </figure>
  );
}
