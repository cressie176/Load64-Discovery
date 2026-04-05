import { deepStrictEqual as deep, equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";

const SUPPORTED_CATALOGUES = ["GameBase64", "MobyGames"];

function deriveTitle(
  gameTitle: string,
  importMode: boolean,
  importTitle: string | null,
): string {
  const base = importMode
    ? `Import Games > ${importTitle ?? gameTitle} > Sources`
    : `${gameTitle} > Sources`;
  return base;
}

function sortSources(
  sources: Array<{ catalogueName: string; entryId: string }>,
) {
  return [...sources].sort((a, b) =>
    a.catalogueName.localeCompare(b.catalogueName),
  );
}

function allLinked(
  sources: Array<{ catalogueName: string; entryId: string }>,
): boolean {
  return sources.length >= SUPPORTED_CATALOGUES.length;
}

function wrapIndex(index: number, delta: number, length: number): number {
  return (index + delta + length) % length;
}

describe("GameCatalogueSourcesListScreen", () => {
  describe("deriveTitle", () => {
    it("returns standard title with game name", () => {
      eq(deriveTitle("Bubble Bobble", false, null), "Bubble Bobble > Sources");
    });

    it("returns import mode title with import title", () => {
      eq(
        deriveTitle("Bubble Bobble", true, "Bubble Bobble"),
        "Import Games > Bubble Bobble > Sources",
      );
    });

    it("falls back to gameTitle when importTitle is null in import mode", () => {
      eq(
        deriveTitle("Bubble Bobble", true, null),
        "Import Games > Bubble Bobble > Sources",
      );
    });
  });

  describe("sortSources", () => {
    it("sorts sources alphabetically by catalogue name", () => {
      const sources = [
        { catalogueName: "MobyGames", entryId: "1234" },
        { catalogueName: "GameBase64", entryId: "243" },
      ];
      const sorted = sortSources(sources);
      deep(sorted[0]?.catalogueName, "GameBase64");
      deep(sorted[1]?.catalogueName, "MobyGames");
    });

    it("does not mutate the original array", () => {
      const sources = [
        { catalogueName: "MobyGames", entryId: "1234" },
        { catalogueName: "GameBase64", entryId: "243" },
      ];
      sortSources(sources);
      eq(sources[0]?.catalogueName, "MobyGames");
    });
  });

  describe("allLinked", () => {
    it("returns false when no sources are linked", () => {
      eq(allLinked([]), false);
    });

    it("returns false when only one source is linked", () => {
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
