import { describe, expect, it } from "vitest";
import {
  PACKING_LISTS,
  packingItemIds,
  placedCorrectly,
  readPackingInstruction,
} from "./packing-mission";

describe("packing mission", () => {
  it("accepts ordinary phrasing and pocket aliases", () => {
    expect(readPackingInstruction("Could you put the ticket in the inner pocket?")).toEqual({
      kind: "move",
      item: "ticket",
      pocket: "inside",
    });
    expect(readPackingInstruction("Put the passport inside the front pocket.")).toEqual({
      kind: "move",
      item: "passport",
      pocket: "front",
    });
  });

  it("uses the destination when a learner corrects a placement", () => {
    expect(
      readPackingInstruction("Move the keys from the front pocket to the side pocket."),
    ).toEqual({
      kind: "move",
      item: "keys",
      pocket: "side",
    });
  });

  it.each([
    "Put the ticket away.",
    "Front pocket, please.",
    "Put the passport and keys in front.",
    "Put the ticket in the front or inside pocket.",
    "Don't put the keys in the side pocket.",
  ])("asks for clarification instead of guessing from %j", (instruction) => {
    expect(readPackingInstruction(instruction).kind).toBe("clarify");
  });

  it("remembers the keys while asking which pocket", () => {
    expect(readPackingInstruction("Put keys in pocket")).toEqual({
      kind: "clarify",
      item: "keys",
      message: "Which pocket for the keys?",
    });
    expect(readPackingInstruction("Side pocket, please.", "keys")).toEqual({
      kind: "move",
      item: "keys",
      pocket: "side",
    });
    expect(readPackingInstruction("Side pocket, please.").kind).toBe("clarify");
  });

  it("uses an explicitly named item in a follow-up", () => {
    expect(readPackingInstruction("Actually, put the ticket in the front pocket.", "keys")).toEqual(
      {
        kind: "move",
        item: "ticket",
        pocket: "front",
      },
    );
    expect(
      readPackingInstruction("Put the passport and ticket in front.", "keys"),
    ).not.toHaveProperty("item");
  });

  it("includes all six items on each list", () => {
    expect(packingItemIds).toHaveLength(6);
    for (const list of PACKING_LISTS) {
      expect(Object.keys(list).sort()).toEqual([...packingItemIds].sort());
    }
    expect(readPackingInstruction("Put the earbuds in the side pocket.")).toEqual({
      kind: "move",
      item: "headphones",
      pocket: "side",
    });
  });

  it("checks the board against the selected list", () => {
    const bag = { passport: "front" } as const;
    expect(placedCorrectly(bag, "passport", PACKING_LISTS[0])).toBe(true);
    expect(placedCorrectly(bag, "passport", PACKING_LISTS[1])).toBe(false);
  });
});
