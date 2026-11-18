import { Snail, Volume2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { detectSounds, GENERIC_TIP, SOUNDS } from "@/lib/sounds";
import type { WordResult } from "@/lib/scoring";
import { speak } from "@/lib/speech";
import { cn } from "@/lib/utils";

const statusText = { correct: "Nailed it", close: "Almost there", missed: "Needs work" } as const;
const statusClass = {
  correct: "bg-success-soft text-success",
  close: "bg-warning-soft text-warning",
  missed: "bg-danger-soft text-danger",
} as const;

export function WordDetail({
  word,
  display,
  ipa,
  open,
  onOpenChange,
}: {
  word: WordResult | null;
  display: string;
  ipa: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const clean = display.replace(/[^\p{L}'’-]/gu, "");
  const sounds = word ? detectSounds(word.target) : [];
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-md rounded-t-[2rem]">
        {word && (
          <div className="px-6 pb-8">
            <DrawerHeader className="px-0 text-left">
              <div className="flex items-center justify-between gap-3">
                <DrawerTitle className="font-display text-4xl">{clean}</DrawerTitle>
                <span className={cn("rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide", statusClass[word.status])}>
                  {statusText[word.status]}
                </span>
              </div>
              <DrawerDescription className="text-lg text-muted-foreground">/{ipa}/</DrawerDescription>
            </DrawerHeader>

            <p className="text-sm font-semibold text-muted-foreground">
              We heard: <span className="text-foreground">{word.heard ? `“${word.heard}”` : "nothing"}</span>
            </p>

            <div className="mt-4 space-y-3">
              {(sounds.length ? sounds.slice(0, 2) : [null]).map((s) => (
                <div key={s ?? "generic"} className="rounded-2xl bg-accent-soft p-4">
                  <p className="font-display text-base font-semibold text-secondary-foreground">
                    {s ? `Mouth tip · ${SOUNDS[s].label} ${SOUNDS[s].ipa}` : "Mouth tip"}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{s ? SOUNDS[s].tip : GENERIC_TIP}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="mint" size="pill" className="flex-1" onClick={() => speak(clean)}>
                <Volume2 /> Replay
              </Button>
              <Button variant="soft" size="pill" onClick={() => speak(clean, { slow: true })}>
                <Snail /> Slow
              </Button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
