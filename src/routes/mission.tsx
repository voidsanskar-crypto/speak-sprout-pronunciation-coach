import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Backpack,
  Check,
  KeyRound,
  Headphones,
  Notebook,
  Plug,
  RotateCcw,
  Star,
  Ticket,
  TrainFront,
  BookUser,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { MicButton } from "@/components/speakup/MicButton";
import { TimedMission } from "@/components/speakup/TimedMission";
import { MicHelp } from "@/components/speakup/MicHelp";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WordMatchReview } from "@/components/speakup/WordMatchReview";
import { awardXp, recordTroubleWords } from "@/hooks/use-progress";
import type { ScoreResult } from "@/lib/scoring";
import { useSpeechRecorder } from "@/hooks/use-speech-recorder";
import {
  BAG_POCKETS,
  PACKING_ITEMS,
  PACKING_LISTS,
  bagPocketIds,
  packingItemIds,
  placedCorrectly,
  readPackingInstruction,
  scorePackingClarity,
  type Bag,
  type PackingItem,
} from "@/lib/packing-mission";
import { isTimedScenario, timedMissions, type TimedScenario } from "@/lib/timed-missions";
import { speak, stopSpeaking } from "@/lib/speech";
import { cn } from "@/lib/utils";

const itemIcons = {
  passport: BookUser,
  ticket: Ticket,
  keys: KeyRound,
  charger: Plug,
  headphones: Headphones,
  notebook: Notebook,
} as const;

const pocketLook = {
  front: "border-primary/20 bg-primary-soft",
  inside: "border-border bg-muted",
  side: "border-accent/20 bg-accent-soft",
} as const;

export const Route = createFileRoute("/mission")({
  validateSearch: (search: Record<string, unknown>): { scenario?: TimedScenario | undefined } => ({
    scenario: isTimedScenario(search["scenario"]) ? search["scenario"] : undefined,
  }),
  head: ({ match }) => ({
    meta: [
      {
        title: `${match.search.scenario ? timedMissions[match.search.scenario].title : "Pack for the train"} — Speak Sprout`,
      },
      { name: "description", content: "Give spoken directions and see what Kiki puts in the bag." },
    ],
  }),
  component: Mission,
});

function Mission() {
  const { scenario } = Route.useSearch();
  return scenario ? <TimedMission key={scenario} scenario={scenario} /> : <PackingMission />;
}

function PackingMission() {
  const [listIndex, setListIndex] = useState(0);
  const packingList = PACKING_LISTS[listIndex % PACKING_LISTS.length]!;
  const [bag, setBag] = useState<Bag>({});
  const [draft, setDraft] = useState("");
  const [focusItem, setFocusItem] = useState<PackingItem | "">("");
  const [clarity, setClarity] = useState<ScoreResult | null>(null);
  const [earnedXp, setEarnedXp] = useState(0);
  const rewarded = useRef(new Set<PackingItem>());
  const [lastTurn, setLastTurn] = useState<{
    instruction: string;
    reply: string;
    pendingItem?: PackingItem | undefined;
    pocketHint?: string | undefined;
  } | null>(null);
  const pendingItem = lastTurn?.pendingItem;
  useEffect(() => stopSpeaking, []);
  const correctCount = packingItemIds.filter((item) =>
    placedCorrectly(bag, item, packingList),
  ).length;
  const complete = correctCount === packingItemIds.length;

  function giveInstruction(instruction: string, spoken = false) {
    if (!instruction.trim() || complete) return;
    const result = readPackingInstruction(instruction, pendingItem);
    const intendedItem = focusItem || result.item;
    if (spoken && intendedItem) {
      const pocketOnly = Boolean(
        pendingItem &&
        pendingItem === intendedItem &&
        !PACKING_ITEMS[intendedItem].aliases.test(instruction.toLowerCase()),
      );
      const scored = scorePackingClarity(
        instruction,
        intendedItem,
        packingList[intendedItem],
        pocketOnly,
      );
      setClarity(scored);
      // An explicitly chosen wrong destination is a task error, not evidence of a sound issue.
      const wrongDestination =
        result.kind === "move" && result.pocket !== packingList[intendedItem];
      recordTroubleWords(
        wrongDestination
          ? scored.words.filter(({ target }) => target === intendedItem)
          : scored.words,
      );
      if (
        result.kind === "move" &&
        !wrongDestination &&
        result.item === intendedItem &&
        !rewarded.current.has(intendedItem)
      ) {
        rewarded.current.add(intendedItem);
        const xp = scored.score >= 90 ? 10 : scored.score >= 70 ? 6 : 3;
        awardXp(xp);
        setEarnedXp((total) => total + xp);
      }
    } else {
      setClarity(null);
    }
    if (result.kind === "clarify") {
      setLastTurn({ instruction, reply: result.message, pendingItem: result.item });
      if (spoken) speak(result.message);
      return;
    }

    const { item, pocket } = result;
    const next = { ...bag, [item]: pocket };
    const name = PACKING_ITEMS[item].label.toLowerCase();
    const location = BAG_POCKETS[pocket].label.toLowerCase();
    const completeAfterMove = packingItemIds.every((entry) =>
      placedCorrectly(next, entry, packingList),
    );
    setBag(next);
    const reply = completeAfterMove
      ? "That’s everything. The bag matches your packing list!"
      : `I put the ${name} in the ${location}.`;
    const pocketHint =
      pocket !== packingList[item]
        ? `Pocket heard: ${BAG_POCKETS[pocket].label}. Packing list: ${BAG_POCKETS[packingList[item]].label}.`
        : undefined;
    setLastTurn({ instruction, reply, pocketHint });
    if (spoken)
      speak(pocketHint ? `${reply} The list says ${BAG_POCKETS[packingList[item]].label}.` : reply);
  }

  const recorder = useSpeechRecorder(
    ([transcript]) => {
      if (transcript) giveInstruction(transcript, true);
    },
    { captureAudio: false },
  );
  const micActive = recorder.status !== "idle";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (micActive || !draft.trim()) return;
    stopSpeaking();
    recorder.clearError();
    giveInstruction(draft.trim());
    setDraft("");
  }

  return (
    <MobileShell>
      <div className="space-y-5">
        <Link to="/arcade" className="inline-block text-sm font-bold text-primary">
          ← Back to Arcade
        </Link>
        <header className="flex items-start gap-3 sm:gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary sm:size-14">
            <TrainFront aria-hidden="true" className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Pack for the train</h1>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Kiki can’t see your list. Tell her where each item goes, then check what she packed.
            </p>
          </div>
        </header>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <section
            aria-labelledby="packing-list"
            className="order-1 rounded-[1.5rem] border border-border bg-card p-4 sm:p-5"
          >
            <h2 id="packing-list" className="font-display text-xl font-semibold">
              Your packing list
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-1.5">
              {packingItemIds.map((item) => {
                const goal = PACKING_ITEMS[item];
                const packed = placedCorrectly(bag, item, packingList);
                const Icon = itemIcons[item];
                return (
                  <li
                    key={item}
                    className="flex min-w-0 items-center gap-1.5 rounded-xl bg-muted/55 px-2 py-2"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{goal.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {BAG_POCKETS[packingList[item]].label}
                      </span>
                    </span>
                    {packed && (
                      <Check
                        aria-label="In the right pocket"
                        className="size-4 shrink-0 text-success"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            aria-labelledby="current-bag"
            className="order-3 xl:order-2 rounded-[1.5rem] border border-border bg-card p-4 sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="current-bag"
                className="flex items-center gap-2 font-display text-xl font-semibold"
              >
                <Backpack aria-hidden="true" className="size-5 text-primary" /> Kiki’s bag
              </h2>
              <span className="text-xs font-bold text-primary">
                {correctCount}/{packingItemIds.length} in place
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {bagPocketIds.map((pocket) => {
                const contents = packingItemIds.filter((item) => bag[item] === pocket);
                return (
                  <div
                    key={pocket}
                    className={cn("min-w-0 rounded-2xl border p-3 sm:min-h-28", pocketLook[pocket])}
                  >
                    <h3 className="text-xs font-extrabold text-foreground">
                      {BAG_POCKETS[pocket].label}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {contents.length ? (
                        contents.map((item) => <PackedItem key={item} item={item} />)
                      ) : (
                        <p className="text-xs text-muted-foreground">Empty</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            aria-labelledby="instruction-heading"
            className="order-2 xl:order-3 xl:col-span-2 rounded-[1.5rem] border border-border bg-card p-4 sm:p-5"
          >
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="rounded-2xl bg-primary-soft p-3.5 text-sm"
            >
              <p className="font-extrabold text-primary">Kiki</p>
              <p className="mt-0.5 font-semibold">
                {lastTurn?.reply ?? "I’m ready. What should I pack first?"}
              </p>
              {lastTurn?.pocketHint && (
                <p className="mt-1 font-semibold text-warning">{lastTurn.pocketHint}</p>
              )}
              {lastTurn && (
                <p className="mt-2 break-words text-xs text-muted-foreground">
                  Instruction received: “{lastTurn.instruction}”
                </p>
              )}
              {pendingItem && (
                <div className="mt-3 flex flex-wrap gap-2" aria-label="Choose a pocket">
                  {bagPocketIds.map((pocket) => (
                    <Button
                      key={pocket}
                      type="button"
                      variant="soft"
                      className="min-h-9 rounded-xl"
                      disabled={micActive}
                      onClick={() => {
                        stopSpeaking();
                        recorder.clearError();
                        giveInstruction(BAG_POCKETS[pocket].label);
                      }}
                    >
                      {BAG_POCKETS[pocket].label}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {complete ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <h2 id="instruction-heading" className="font-display text-xl font-semibold">
                  Mission complete
                </h2>
                {earnedXp > 0 && (
                  <span className="text-sm font-bold text-primary">+{earnedXp} speaking XP</span>
                )}
                <Button
                  type="button"
                  variant="soft"
                  size="pill"
                  onClick={() => {
                    stopSpeaking();
                    setListIndex((index) => index + 1);
                    setBag({});
                    setLastTurn(null);
                    setDraft("");
                    setFocusItem("");
                    setClarity(null);
                    setEarnedXp(0);
                    rewarded.current.clear();
                  }}
                >
                  <RotateCcw aria-hidden="true" /> Try a new list
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    <MicButton
                      status={recorder.status}
                      onStart={() => void recorder.start()}
                      onStop={recorder.stop}
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 id="instruction-heading" className="font-display text-lg font-semibold">
                      {recorder.status === "listening"
                        ? "Listening…"
                        : micActive
                          ? "Getting the microphone ready…"
                          : pendingItem
                            ? "Say or choose a pocket"
                            : "Give one instruction"}
                    </h2>
                    <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                      {micActive
                        ? recorder.interim || "Speak when you’re ready. Tap stop when you’re done."
                        : pendingItem
                          ? "Say just “front pocket,” “inside pocket,” or “side pocket.”"
                          : "Try “Put the passport in the front pocket.”"}
                    </p>
                  </div>
                </div>
                {recorder.error && (
                  <div className="mb-3">
                    <MicHelp
                      error={recorder.error}
                      onRetry={() => void recorder.start()}
                      onDismiss={recorder.clearError}
                    />
                  </div>
                )}
                <div className="mb-3">
                  <label className="block text-xs font-bold" htmlFor="packing-focus">
                    Choose an item for clearer feedback (optional)
                  </label>
                  <select
                    id="packing-focus"
                    value={focusItem}
                    onChange={(event) => setFocusItem(event.target.value as PackingItem | "")}
                    disabled={micActive}
                    className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  >
                    <option value="">Follow my instruction</option>
                    {packingItemIds.map((item) => (
                      <option key={item} value={item}>
                        {PACKING_ITEMS[item].label}
                      </option>
                    ))}
                  </select>
                </div>
                <form onSubmit={submit} className="flex items-center gap-2">
                  <Input
                    aria-label="Type an instruction"
                    maxLength={180}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={pendingItem ? "Or type a pocket name" : "Or type an instruction"}
                    className="h-10 min-w-0 flex-1 rounded-xl"
                  />
                  <Button
                    type="submit"
                    variant="hero"
                    className="h-10 rounded-xl"
                    disabled={micActive || !draft.trim()}
                  >
                    Send <ArrowRight aria-hidden="true" />
                  </Button>
                </form>
                <p className="mt-2 text-xs text-muted-foreground">
                  Spoken instructions earn clarity stars and packing XP. Typed instructions can
                  still complete the mission.
                </p>
              </>
            )}
            {clarity && (
              <div className="mt-4 rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">Clarity score · {clarity.score}% word match</p>
                  <span
                    className="flex items-center gap-0.5 text-warning"
                    aria-label={`${clarity.score >= 90 ? 3 : clarity.score >= 70 ? 2 : 1} of 3 stars`}
                  >
                    {[70, 90].map((threshold) => (
                      <Star
                        key={threshold}
                        aria-hidden="true"
                        className={cn("size-4", clarity.score >= threshold && "fill-current")}
                      />
                    ))}
                    <Star aria-hidden="true" className="order-first size-4 fill-current" />
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Compares the item and pocket words in the browser transcript with the packing
                  list.
                </p>
                <WordMatchReview result={clarity} />
              </div>
            )}
          </section>
        </div>
      </div>
    </MobileShell>
  );
}

function PackedItem({ item }: { item: PackingItem }) {
  const Icon = itemIcons[item];
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-lg bg-card px-2 py-1 text-xs font-bold">
      <Icon aria-hidden="true" className="size-3 shrink-0 text-primary" />{" "}
      {PACKING_ITEMS[item].label}
    </span>
  );
}
