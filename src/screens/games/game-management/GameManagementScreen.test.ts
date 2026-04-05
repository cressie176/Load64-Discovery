import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { GAME_MANAGEMENT_ITEMS, wrapIndex } from "./items.ts";

describe("GameManagementScreen", () => {
  describe("GAME_MANAGEMENT_ITEMS", () => {
    it("has the correct number of items", () => {
      eq(GAME_MANAGEMENT_ITEMS.length, 15);
    });

    it("has items in the correct order with correct labels", () => {
      const labels = GAME_MANAGEMENT_ITEMS.map((item) => item.label);
      deep(labels, [
        "Game Info",
        "ROMs",
        "Cover Thumbnail",
        "Loading Screen",
        "Title Screen",
        "Gameplay Screen",
        "Catalogue Sources",
        "Snapshots",
        "Controls",
        "Controllers",
        "Profiles",
        "VICE Arguments",
        "Key Mappings",
        "Environment Variables",
        "Delete Game",
      ]);
    });

    it("last item has delete-game action", () => {
      const lastItem = GAME_MANAGEMENT_ITEMS[GAME_MANAGEMENT_ITEMS.length - 1];
      eq(lastItem?.action, "delete-game");
    });

    it("all non-delete items have a screen destination", () => {
      const navItems = GAME_MANAGEMENT_ITEMS.slice(0, -1);
      for (const item of navItems) {
        eq(typeof item.screen, "string");
      }
    });

    it("media items have a mediaSlot", () => {
      const mediaLabels = [
        "Cover Thumbnail",
        "Loading Screen",
        "Title Screen",
        "Gameplay Screen",
      ];
      for (const label of mediaLabels) {
        const item = GAME_MANAGEMENT_ITEMS.find((i) => i.label === label);
        ok(item, `item ${label} not found`);
        ok("mediaSlot" in item && item.mediaSlot, `${label} missing mediaSlot`);
      }
    });

    it("non-media navigation items do not have a mediaSlot", () => {
      const nonMediaLabels = [
        "Game Info",
        "ROMs",
        "Catalogue Sources",
        "Snapshots",
        "Controls",
        "Controllers",
        "Profiles",
        "VICE Arguments",
        "Key Mappings",
        "Environment Variables",
      ];
      for (const label of nonMediaLabels) {
        const item = GAME_MANAGEMENT_ITEMS.find((i) => i.label === label);
        ok(item, `item ${label} not found`);
        eq(
          "mediaSlot" in item ? item.mediaSlot : undefined,
          undefined,
          `${label} should not have mediaSlot`,
        );
      }
    });
  });

  describe("wrapIndex", () => {
    it("moves forward by delta", () => {
      eq(wrapIndex(0, 1, 15), 1);
      eq(wrapIndex(7, 1, 15), 8);
    });

    it("moves backward by delta", () => {
      eq(wrapIndex(7, -1, 15), 6);
      eq(wrapIndex(1, -1, 15), 0);
    });

    it("wraps forward past the end to 0", () => {
      eq(wrapIndex(14, 1, 15), 0);
    });

    it("wraps backward before start to last index", () => {
      eq(wrapIndex(0, -1, 15), 14);
    });
  });

  describe("delete confirmation logic", () => {
    function isDeleteConfirmed(input: string, title: string): boolean {
      return input.trim().toLowerCase() === title.toLowerCase();
    }

    it("confirms when input matches title exactly", () => {
      ok(isDeleteConfirmed("Bubble Bobble", "Bubble Bobble"));
    });

    it("confirms case-insensitively", () => {
      ok(isDeleteConfirmed("bubble bobble", "Bubble Bobble"));
      ok(isDeleteConfirmed("BUBBLE BOBBLE", "Bubble Bobble"));
    });

    it("confirms with leading/trailing whitespace trimmed", () => {
      ok(isDeleteConfirmed("  Bubble Bobble  ", "Bubble Bobble"));
    });

    it("does not confirm when input is empty", () => {
      eq(isDeleteConfirmed("", "Bubble Bobble"), false);
    });

    it("does not confirm when input is partial", () => {
      eq(isDeleteConfirmed("Bubble", "Bubble Bobble"), false);
    });

    it("does not confirm when input does not match", () => {
      eq(isDeleteConfirmed("Elite", "Bubble Bobble"), false);
    });
  });
});
