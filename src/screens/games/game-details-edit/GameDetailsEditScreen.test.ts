import assert from "node:assert/strict";
import { describe, it } from "node:test";

function deriveScreenTitle(
  importMode: boolean,
  gameTitle: string,
  fetchSource: string | null,
  importTitle?: string,
): string {
  const label = importTitle ?? gameTitle;
  if (importMode) {
    if (fetchSource) {
      return `Import Games > ${label} > Details > ${fetchSource}`;
    }
    return `Import Games > ${label} > Details`;
  }
  if (fetchSource) {
    return `${label} > Details > ${fetchSource}`;
  }
  return `${label} > Details`;
}

describe("GameDetailsEditScreen", () => {
  describe("deriveScreenTitle", () => {
    it("returns simple edit breadcrumb", () => {
      assert.equal(
        deriveScreenTitle(false, "Bubble Bobble", null),
        "Bubble Bobble > Details",
      );
    });

    it("returns import breadcrumb before fetch", () => {
      assert.equal(
        deriveScreenTitle(true, "Bubble Bobble", null),
        "Import Games > Bubble Bobble > Details",
      );
    });

    it("uses importTitle when provided", () => {
      assert.equal(
        deriveScreenTitle(true, "Bubble Bobble", null, "BB disc1"),
        "Import Games > BB disc1 > Details",
      );
    });

    it("appends fetch source in import mode after fetch", () => {
      assert.equal(
        deriveScreenTitle(true, "Bubble Bobble", "GameBase64: 243"),
        "Import Games > Bubble Bobble > Details > GameBase64: 243",
      );
    });

    it("appends fetch source in simple mode after fetch", () => {
      assert.equal(
        deriveScreenTitle(false, "Elite", "GameBase64: 881"),
        "Elite > Details > GameBase64: 881",
      );
    });
  });
});
