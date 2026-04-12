import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GAME_MANAGEMENT_ITEMS,
  GAME_MANAGEMENT_ROWS,
  wrapIndex,
} from "./items.ts";

describe("GameManagementScreen", () => {
  describe("GAME_MANAGEMENT_ITEMS", () => {
    it("has the correct number of items", () => {
      eq(GAME_MANAGEMENT_ITEMS.length, 12);
    });

    it("has items in the correct order with correct labels", () => {
      const labels = GAME_MANAGEMENT_ITEMS.map((item) => item.label);
      deep(labels, [
        "Details",
        "Catalogues",
        "ROMs",
        "Snapshots",
        "Cover Art",
        "Screenshots",
        "Controls",
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

    it("Cover Art item navigates to game-cover-art", () => {
      const coverArtItem = GAME_MANAGEMENT_ITEMS.find(
        (i) => i.label === "Cover Art",
      );
      ok(coverArtItem, "Cover Art item not found");
      eq(coverArtItem.screen, "game-cover-art");
    });

    it("Screenshots item navigates to game-screenshots", () => {
      const screenshotsItem = GAME_MANAGEMENT_ITEMS.find(
        (i) => i.label === "Screenshots",
      );
      ok(screenshotsItem, "Screenshots item not found");
      eq(screenshotsItem.screen, "game-screenshots");
    });
  });

  describe("GAME_MANAGEMENT_ROWS", () => {
    it("has group headers for each group", () => {
      const headers = GAME_MANAGEMENT_ROWS.filter(
        (row) => row.kind === "group-header",
      ).map((row) => row.label);
      deep(headers, ["GAME", "MEDIA", "CONFIGURATION", "DANGER ZONE"]);
    });

    it("has all items from GAME_MANAGEMENT_ITEMS as item rows", () => {
      const itemLabels = GAME_MANAGEMENT_ROWS.filter(
        (row) => row.kind === "item",
      ).map((row) => row.item.label);
      deep(
        itemLabels,
        GAME_MANAGEMENT_ITEMS.map((item) => item.label),
      );
    });

    it("group headers are not in GAME_MANAGEMENT_ITEMS", () => {
      const headerLabels = GAME_MANAGEMENT_ROWS.filter(
        (row) => row.kind === "group-header",
      ).map((row) => row.label);
      const itemLabels = GAME_MANAGEMENT_ITEMS.map((item) => item.label);
      for (const header of headerLabels) {
        eq(
          itemLabels.includes(header),
          false,
          `"${header}" should not be in GAME_MANAGEMENT_ITEMS`,
        );
      }
    });
  });

  describe("wrapIndex", () => {
    it("moves forward by delta", () => {
      eq(wrapIndex(0, 1, 12), 1);
      eq(wrapIndex(5, 1, 12), 6);
    });

    it("moves backward by delta", () => {
      eq(wrapIndex(5, -1, 12), 4);
      eq(wrapIndex(1, -1, 12), 0);
    });

    it("wraps forward past the end to 0", () => {
      eq(wrapIndex(11, 1, 12), 0);
    });

    it("wraps backward before start to last index", () => {
      eq(wrapIndex(0, -1, 12), 11);
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
