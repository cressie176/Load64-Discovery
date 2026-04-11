import { deepStrictEqual as deep, equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";

const SUPPORTED_CATALOGUES = ["GameBase64", "MobyGames"];

function deriveTitle(
  gameTitle: string,
  importMode: boolean,
  importTitle: string | null,
): string {
  if (importMode) {
    return `Import Games > ${importTitle ?? gameTitle} > Catalogues`;
  }
  return `${gameTitle} > Catalogues`;
}

function sortLinks(links: Array<{ catalogueName: string; entryId: string }>) {
  return [...links].sort((a, b) =>
    a.catalogueName.localeCompare(b.catalogueName),
  );
}

function allLinked(
  links: Array<{ catalogueName: string; entryId: string }>,
): boolean {
  return links.length >= SUPPORTED_CATALOGUES.length;
}

function wrapIndex(index: number, delta: number, length: number): number {
  return (index + delta + length) % length;
}

describe("GameCatalogueLinksScreen", () => {
  describe("deriveTitle", () => {
    it("returns standard title with game name", () => {
      eq(
        deriveTitle("Bubble Bobble", false, null),
        "Bubble Bobble > Catalogues",
      );
    });

    it("returns import mode title with import title", () => {
      eq(
        deriveTitle("Bubble Bobble", true, "Bubble Bobble"),
        "Import Games > Bubble Bobble > Catalogues",
      );
    });

    it("falls back to gameTitle when importTitle is null in import mode", () => {
      eq(
        deriveTitle("Bubble Bobble", true, null),
        "Import Games > Bubble Bobble > Catalogues",
      );
    });
  });

  describe("sortLinks", () => {
    it("sorts links alphabetically by catalogue name", () => {
      const links = [
        { catalogueName: "MobyGames", entryId: "1234" },
        { catalogueName: "GameBase64", entryId: "243" },
      ];
      const sorted = sortLinks(links);
      deep(sorted[0]?.catalogueName, "GameBase64");
      deep(sorted[1]?.catalogueName, "MobyGames");
    });

    it("does not mutate the original array", () => {
      const links = [
        { catalogueName: "MobyGames", entryId: "1234" },
        { catalogueName: "GameBase64", entryId: "243" },
      ];
      sortLinks(links);
      eq(links[0]?.catalogueName, "MobyGames");
    });
  });

  describe("allLinked", () => {
    it("returns false when no links are present", () => {
      eq(allLinked([]), false);
    });

    it("returns false when only one catalogue is linked", () => {
      eq(allLinked([{ catalogueName: "GameBase64", entryId: "243" }]), false);
    });

    it("returns true when all supported catalogues are linked", () => {
      eq(
        allLinked([
          { catalogueName: "GameBase64", entryId: "243" },
          { catalogueName: "MobyGames", entryId: "1188" },
        ]),
        true,
      );
    });
  });

  describe("bottom bar message", () => {
    it("shows all-linked message when all catalogues are linked and no status message", () => {
      const links = [
        { catalogueName: "GameBase64", entryId: "243" },
        { catalogueName: "MobyGames", entryId: "1188" },
      ];
      const statusMessage = "";
      const message =
        statusMessage ||
        (allLinked(links)
          ? "Bubble Bobble is linked to all supported catalogues."
          : "");
      eq(message, "Bubble Bobble is linked to all supported catalogues.");
    });

    it("shows status message over all-linked message when both are present", () => {
      const links = [
        { catalogueName: "GameBase64", entryId: "243" },
        { catalogueName: "MobyGames", entryId: "1188" },
      ];
      const statusMessage = "GameBase64 removed";
      const message =
        statusMessage ||
        (allLinked(links)
          ? "Bubble Bobble is linked to all supported catalogues."
          : "");
      eq(message, "GameBase64 removed");
    });

    it("shows nothing when catalogues are not all linked and no status message", () => {
      const links = [{ catalogueName: "GameBase64", entryId: "243" }];
      const statusMessage = "";
      const message =
        statusMessage ||
        (allLinked(links)
          ? "Bubble Bobble is linked to all supported catalogues."
          : "");
      eq(message, "");
    });
  });

  describe("wrapIndex", () => {
    it("moves forward", () => {
      eq(wrapIndex(0, 1, 3), 1);
    });

    it("wraps forward past end", () => {
      eq(wrapIndex(2, 1, 3), 0);
    });

    it("moves backward", () => {
      eq(wrapIndex(2, -1, 3), 1);
    });

    it("wraps backward past start", () => {
      eq(wrapIndex(0, -1, 3), 2);
    });
  });
});
