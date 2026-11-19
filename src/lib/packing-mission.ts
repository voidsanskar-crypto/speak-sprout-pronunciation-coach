import { scoreTranscript } from "./scoring";

const items = {
  passport: { label: "Passport", aliases: /\bpassports?\b/ },
  ticket: { label: "Ticket", aliases: /\btickets?\b/ },
  keys: { label: "Keys", aliases: /\bkeys?\b/ },
  charger: { label: "Charger", aliases: /\bchargers?\b/ },
  headphones: { label: "Headphones", aliases: /\b(?:headphones?|earphones?|earbuds?)\b/ },
  notebook: { label: "Notebook", aliases: /\bnote ?books?\b/ },
} as const;

const pockets = {
  front: { label: "Front pocket", aliases: /\bfront\b/ },
  inside: { label: "Inside pocket", aliases: /\b(?:inside|inner|interior)\b/ },
  side: { label: "Side pocket", aliases: /\bside\b/ },
} as const;

export const PACKING_ITEMS = items;
export const BAG_POCKETS = pockets;

export type PackingItem = keyof typeof items;
export type BagPocket = keyof typeof pockets;
export type Bag = Partial<Record<PackingItem, BagPocket>>;

export const PACKING_LISTS = [
  {
    passport: "front",
    ticket: "inside",
    keys: "side",
    charger: "front",
    headphones: "inside",
    notebook: "side",
  },
  {
    passport: "inside",
    ticket: "side",
    keys: "front",
    charger: "side",
    headphones: "front",
    notebook: "inside",
  },
  {
    passport: "side",
    ticket: "front",
    keys: "inside",
    charger: "inside",
    headphones: "side",
    notebook: "front",
  },
] as const satisfies readonly Record<PackingItem, BagPocket>[];

export type PackingList = Record<PackingItem, BagPocket>;

type Instruction =
  | { kind: "move"; item: PackingItem; pocket: BagPocket }
  | { kind: "clarify"; message: string; item?: PackingItem };

export const packingItemIds = Object.keys(items) as PackingItem[];
export const bagPocketIds = Object.keys(pockets) as BagPocket[];

export function placedCorrectly(bag: Bag, item: PackingItem, list: PackingList) {
  return bag[item] === list[item];
}

export function readPackingInstruction(transcript: string, pendingItem?: PackingItem): Instruction {
  const text = transcript.toLowerCase().replace(/’/g, "'");
  const namedItems = packingItemIds.filter((item) => items[item].aliases.test(text));

  const item = namedItems[0] ?? pendingItem;
  if (namedItems.length > 1 || !item) {
    return {
      kind: "clarify",
      message: namedItems.length
        ? "Let’s pack one thing at a time. Which item should I move first?"
        : "Which item should I pack? Use a name from your packing list.",
    };
  }

  if (/\b(?:not|don't|never|instead of)\b/.test(text)) {
    return {
      kind: "clarify",
      item,
      message: `Tell me which pocket you do want for the ${items[item].label.toLowerCase()}.`,
    };
  }

  // In a correction such as “move it from the front to the side”, apply only the destination.
  // A short reply can reuse the item only while a pocket clarification is pending.
  const destination = text.match(/\bfrom\b.*?\bto\b(.*)/)?.[1] ?? text;
  // “Inside the front pocket” uses inside as a preposition, not the name of another pocket.
  const pocketNames = destination.replace(/\binside\s+(?:the\s+)?(?=front\b|side\b)/g, "");
  const namedPockets = bagPocketIds.filter((pocket) => pockets[pocket].aliases.test(pocketNames));

  if (namedPockets.length !== 1) {
    return {
      kind: "clarify",
      item,
      message: namedPockets.length
        ? `I heard more than one pocket. Where should I put the ${items[item].label.toLowerCase()}?`
        : `Which pocket for the ${items[item].label.toLowerCase()}?`,
    };
  }

  return { kind: "move", item, pocket: namedPockets[0]! };
}

// Score the instruction's item and destination without requiring a fixed sentence.
export function scorePackingClarity(
  transcript: string,
  item: PackingItem,
  pocket: BagPocket,
  pocketOnly: boolean,
) {
  const text = transcript.toLowerCase().replace(/’/g, "'");
  const destination = text.match(/\bfrom\b.*?\bto\b(.*)/)?.[1];
  const content = (
    destination ? [pocketOnly ? "" : text.split(/\bfrom\b/)[0], destination].join(" ") : text
  ).replace(/\binside\s+(?:the\s+)?(?=front\b|side\b)/g, "");
  const itemName = items[item].label.toLowerCase();
  const pocketName = pockets[pocket].label.toLowerCase();
  const simplified = content
    .replace(items[item].aliases, pocketOnly ? "" : itemName)
    .replace(pockets[pocket].aliases, pocketName.split(" ")[0]!)
    .replace(
      /\b(?:put|pack|place|move|take|add|can|could|would|you|i|please|kiki|the|a|an|my|in|into|on|to|it|now|for|me|lets|let's)\b/g,
      " ",
    );
  const expected = pocketOnly ? pocketName : `${itemName} ${pocketName}`;
  return scoreTranscript(expected, simplified);
}
