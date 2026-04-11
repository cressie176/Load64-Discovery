import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";

function deriveTitle(
  gameTitle: string,
  catalogueName: string,
  importMode: boolean,
  importTitle: string | null,
): string {
  if (importMode) {
    return `Import Games > ${importTitle ?? gameTitle} > Catalogues > ${catalogueName}`;
  }
  return `${gameTitle} > Catalogues > ${catalogueName}`;
}

function validate(entryId: string): string | null {
  if (!entryId.trim()) return "ID is required.";
  return null;
}

describe("GameCatalogueLinkEditScreen", () => {
  describe("deriveTitle", () => {
    it("returns standard title with game name and catalogue", () => {
      eq(
        deriveTitle("Bubble Bobble", "GameBase64", false, null),
        "Bubble Bobble > Catalogues > GameBase64",
      );
    });

    it("returns import mode title with import title and catalogue", () => {
      eq(
        deriveTitle("Bubble Bobble", "MobyGames", true, "Bubble Bobble"),
        "Import Games > Bubble Bobble > Catalogues > MobyGames",
      );
    });

    it("falls back to gameTitle when importTitle is null in import mode", () => {
      eq(
        deriveTitle("Bubble Bobble", "GameBase64", true, null),
        "Import Games > Bubble Bobble > Catalogues > GameBase64",
      );
    });
  });

  describe("validate", () => {
    it("returns error when id is empty", () => {
      eq(validate(""), "ID is required.");
    });

    it("returns error when id is only whitespace", () => {
      eq(validate("   "), "ID is required.");
    });

    it("returns null when id is valid", () => {
      eq(validate("243"), null);
    });

    it("returns null when id has surrounding whitespace but is not empty", () => {
      eq(validate("  243  "), null);
    });
  });
});
