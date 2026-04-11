import { deepStrictEqual as deep, equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";

const SUPPORTED_CATALOGUES = ["GameBase64", "MobyGames"];

function deriveAvailableCatalogues(linkedCatalogues: string[]): string[] {
  return SUPPORTED_CATALOGUES.filter((c) => !linkedCatalogues.includes(c)).sort(
    (a, b) => a.localeCompare(b),
  );
}

function deriveTitle(
  gameTitle: string,
  importMode: boolean,
  importTitle: string | null,
): string {
  if (importMode) {
    return `Import Games > ${importTitle ?? gameTitle} > Catalogues > Add`;
  }
  return `${gameTitle} > Catalogues > Add`;
}

function validate(catalogue: string, entryId: string): string | null {
  if (!catalogue) return "Catalogue is required.";
  if (!entryId.trim()) return "ID is required.";
  return null;
}

describe("GameCatalogueLinkAddScreen", () => {
  describe("deriveAvailableCatalogues", () => {
    it("returns all catalogues when none are linked", () => {
      deep(deriveAvailableCatalogues([]), ["GameBase64", "MobyGames"]);
    });

    it("excludes already linked catalogues", () => {
      deep(deriveAvailableCatalogues(["MobyGames"]), ["GameBase64"]);
    });

    it("returns empty array when all catalogues are linked", () => {
      deep(deriveAvailableCatalogues(["GameBase64", "MobyGames"]), []);
    });

    it("sorts available catalogues alphabetically", () => {
      const result = deriveAvailableCatalogues([]);
      eq(result[0], "GameBase64");
      eq(result[1], "MobyGames");
    });
  });

  describe("deriveTitle", () => {
    it("returns standard title for normal mode", () => {
      eq(
        deriveTitle("Bubble Bobble", false, null),
        "Bubble Bobble > Catalogues > Add",
      );
    });

    it("returns import mode title with import title", () => {
      eq(
        deriveTitle("Bubble Bobble", true, "Bubble Bobble"),
        "Import Games > Bubble Bobble > Catalogues > Add",
      );
    });

    it("falls back to gameTitle when importTitle is null in import mode", () => {
      eq(
        deriveTitle("Bubble Bobble", true, null),
        "Import Games > Bubble Bobble > Catalogues > Add",
      );
    });
  });

  describe("validate", () => {
    it("returns error when catalogue is empty", () => {
      eq(validate("", "1234"), "Catalogue is required.");
    });

    it("returns error when id is empty", () => {
      eq(validate("MobyGames", ""), "ID is required.");
    });

    it("returns error when id is only whitespace", () => {
      eq(validate("MobyGames", "   "), "ID is required.");
    });

    it("returns null when both fields are valid", () => {
      eq(validate("MobyGames", "1234"), null);
    });

    it("returns null when id has surrounding whitespace but is not empty", () => {
      eq(validate("GameBase64", "  243  "), null);
    });
  });
});
