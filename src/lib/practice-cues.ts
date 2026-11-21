let context: AudioContext | undefined;

// Unlock playback during the tap, before microphone permission or recognition startup.
export function preparePracticeCues() {
  try {
    context ??= new AudioContext();
    if (context.state !== "running") void context.resume().catch(() => {});
  } catch {
    /* Recording also works on browsers without Web Audio playback. */
  }
}

export function playPracticeCue(kind: "ready" | "complete") {
  if (!context || context.state !== "running") return;
  const notes = kind === "ready" ? [530] : [660, 880];
  for (const [index, frequency] of notes.entries()) {
    const start = context.currentTime + index * 0.095;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.065, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.085);
    oscillator.connect(gain).connect(context.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(start + 0.09);
  }
}
