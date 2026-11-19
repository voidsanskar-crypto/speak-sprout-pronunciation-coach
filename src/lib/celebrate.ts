export function shouldCelebrate(score: number): boolean {
  return score >= 90;
}

export async function fireConfetti() {
  const { default: confetti } = await import("canvas-confetti");
  const colors = ["#ff7a59", "#ffc145", "#2ec4b6", "#7bd88f", "#ffffff"];
  confetti({
    particleCount: 110,
    spread: 75,
    origin: { y: 0.35 },
    colors,
    disableForReducedMotion: true,
  });
  setTimeout(
    () =>
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.5 },
        colors,
        disableForReducedMotion: true,
      }),
    250,
  );
  setTimeout(
    () =>
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.5 },
        colors,
        disableForReducedMotion: true,
      }),
    400,
  );
}
