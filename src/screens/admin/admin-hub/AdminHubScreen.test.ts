import { deepStrictEqual as deep, equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import { ADMIN_HUB_ITEMS, QUIT_OPTIONS, wrapIndex } from "./items.ts";

describe("AdminHubScreen", () => {
  describe("ADMIN_HUB_ITEMS", () => {
    it("has the correct number of items", () => {
      eq(ADMIN_HUB_ITEMS.length, 9);
    });

    it("has items in the correct order with correct labels", () => {
      const labels = ADMIN_HUB_ITEMS.map((item) => item.label);
      deep(labels, [
        "General Settings",
        "Binaries",
        "Controller Families",
        "Controllers",
        "Profiles",
        "Compilations",
        "Import Games",
        "Audit",
        "Quit Load!64",
      ]);
    });

    it("last item has quit action", () => {
      const lastItem = ADMIN_HUB_ITEMS[ADMIN_HUB_ITEMS.length - 1];
      eq(lastItem?.action, "quit");
    });

    it("all non-quit items have a screen destination", () => {
      const navItems = ADMIN_HUB_ITEMS.slice(0, -1);
      for (const item of navItems) {
        eq(typeof item.screen, "string");
      }
    });
  });

  describe("QUIT_OPTIONS", () => {
    it("has Yes and No options", () => {
      deep([...QUIT_OPTIONS], ["Yes", "No"]);
    });

    it("Yes is first", () => {
      eq(QUIT_OPTIONS[0], "Yes");
    });

    it("No is second", () => {
      eq(QUIT_OPTIONS[1], "No");
    });
  });

  describe("wrapIndex", () => {
    it("moves forward by delta", () => {
      eq(wrapIndex(0, 1, 9), 1);
      eq(wrapIndex(3, 1, 9), 4);
    });

    it("moves backward by delta", () => {
      eq(wrapIndex(3, -1, 9), 2);
      eq(wrapIndex(1, -1, 9), 0);
    });

    it("wraps forward past the end to 0", () => {
      eq(wrapIndex(8, 1, 9), 0);
    });

    it("wraps backward before start to last index", () => {
      eq(wrapIndex(0, -1, 9), 8);
    });

    it("wraps correctly for overlay with 2 items", () => {
      eq(wrapIndex(1, 1, 2), 0);
      eq(wrapIndex(0, -1, 2), 1);
    });
  });
});
