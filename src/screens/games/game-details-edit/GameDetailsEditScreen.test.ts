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

interface FetchedGameDetails {
  title?: string;
  publisher?: string;
  year?: string;
  notes?: string;
}

function simulateFetch(
  _gameId: string,
  catalogueName: string,
  entryId: string,
): Promise<FetchedGameDetails> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (catalogueName === "GameBase64") {
        const results: Record<string, FetchedGameDetails> = {
          "243": {
            title: "Bubble Bobble (Taito, 1987)",
            publisher: "Taito Corporation",
            notes: "Classic arcade conversion.",
          },
          "881": {
            title: "Elite",
            publisher: "Firebird Software",
            year: "1985",
          },
        };
        const result = results[entryId];
        if (result) {
          resolve(result);
        } else {
          reject(new Error(`No entry found for ${catalogueName}: ${entryId}`));
        }
      } else if (catalogueName === "MobyGames") {
        const results: Record<string, FetchedGameDetails> = {
          "1188": {
            title: "Bubble Bobble",
            publisher: "Taito",
            year: "1987",
          },
        };
        const result = results[entryId];
        if (result) {
          resolve(result);
        } else {
          reject(new Error(`No entry found for ${catalogueName}: ${entryId}`));
        }
      } else {
        reject(new Error(`Unknown catalogue: ${catalogueName}`));
      }
    }, 0);
  });
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

  describe("simulateFetch", () => {
    it("resolves with fetched details for a known GameBase64 entry", async () => {
      const result = await simulateFetch("game-bubble", "GameBase64", "243");
      assert.ok(typeof result.title === "string");
      assert.ok(typeof result.publisher === "string");
    });

    it("resolves with fetched details for a known MobyGames entry", async () => {
      const result = await simulateFetch("game-bubble", "MobyGames", "1188");
      assert.ok(typeof result.title === "string");
    });

    it("rejects for an unknown entry", async () => {
      await assert.rejects(
        () => simulateFetch("game-x", "GameBase64", "9999"),
        /No entry found/,
      );
    });

    it("rejects for an unknown catalogue", async () => {
      await assert.rejects(
        () => simulateFetch("game-bubble", "UnknownCat", "1"),
        /Unknown catalogue/,
      );
    });
  });
});
