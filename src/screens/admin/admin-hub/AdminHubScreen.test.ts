import { deepStrictEqual as deep, equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_HUB_ITEMS,
  ADMIN_HUB_ROWS,
  QUIT_OPTIONS,
  wrapIndex,
} from "./items.ts";

describe("AdminHubScreen", () => {
  describe("ADMIN_HUB_ITEMS", () => {
    it("has the correct number of items", () => {
      eq(ADMIN_HUB_ITEMS.length, 10);
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
        "Update Load!64 Catalogue",
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

  describe("ADMIN_HUB_ROWS", () => {
    it("has group headers for each group", () => {
      const headers = ADMIN_HUB_ROWS.filter(
        (row) => row.kind === "group-header",
      ).map((row) => row.label);
      deep(headers, [
        "SYSTEM CONFIGURATION",
        "GAMING CONFIGURATION",
        "TOOLS",
        "DANGER ZONE",
      ]);
    });

    it("has all items from ADMIN_HUB_ITEMS as item rows", () => {
      const itemLabels = ADMIN_HUB_ROWS.filter(
        (row) => row.kind === "item",
      ).map((row) => row.item.label);
      deep(
        itemLabels,
        ADMIN_HUB_ITEMS.map((item) => item.label),
      );
    });

    it("group headers are not in ADMIN_HUB_ITEMS", () => {
      const headerLabels = ADMIN_HUB_ROWS.filter(
        (row) => row.kind === "group-header",
      ).map((row) => row.label);
      const itemLabels = ADMIN_HUB_ITEMS.map((item) => item.label);
      for (const header of headerLabels) {
        eq(
          itemLabels.includes(header),
          false,
          `"${header}" should not be in ADMIN_HUB_ITEMS`,
        );
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
      eq(wrapIndex(0, 1, 10), 1);
      eq(wrapIndex(3, 1, 10), 4);
    });

    it("moves backward by delta", () => {
      eq(wrapIndex(3, -1, 10), 2);
      eq(wrapIndex(1, -1, 10), 0);
    });

    it("wraps forward past the end to 0", () => {
      eq(wrapIndex(9, 1, 10), 0);
    });

    it("wraps backward before start to last index", () => {
      eq(wrapIndex(0, -1, 10), 9);
    });

    it("wraps correctly for overlay with 2 items", () => {
      eq(wrapIndex(1, 1, 2), 0);
      eq(wrapIndex(0, -1, 2), 1);
    });
  });
});
