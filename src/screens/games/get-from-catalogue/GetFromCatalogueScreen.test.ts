import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";

type CatalogueFlow = "details" | "cover-art" | "screenshots";

interface FetchedGameDetails {
  title?: string;
  publisher?: string;
  year?: string;
  notes?: string;
}

function deriveScreenTitle(
  flow: CatalogueFlow,
  importMode: boolean,
  gameTitle: string,
  importTitle?: string,
): string {
  const label = importTitle ?? gameTitle;
  const prefix = importMode ? `Import Games > ${label}` : label;

  switch (flow) {
    case "details":
      return `${prefix} > Details > From Catalogue`;
    case "cover-art":
      return `${prefix} > Media > Cover Art > From Catalogue`;
    case "screenshots":
      return `${prefix} > Media > Screenshots > From Catalogue`;
  }
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
          "1188": { title: "Bubble Bobble", publisher: "Taito", year: "1987" },
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

describe("GetFromCatalogueScreen", () => {
  describe("deriveScreenTitle", () => {
    describe("details flow", () => {
      it("returns standard breadcrumb", () => {
        eq(
          deriveScreenTitle("details", false, "Bubble Bobble"),
          "Bubble Bobble > Details > From Catalogue",
        );
      });

      it("returns import breadcrumb", () => {
        eq(
          deriveScreenTitle("details", true, "Bubble Bobble"),
          "Import Games > Bubble Bobble > Details > From Catalogue",
        );
      });

      it("uses importTitle when provided in import mode", () => {
        eq(
          deriveScreenTitle("details", true, "Bubble Bobble", "BB disc1"),
          "Import Games > BB disc1 > Details > From Catalogue",
        );
      });
    });

    describe("cover-art flow", () => {
      it("returns standard breadcrumb", () => {
        eq(
          deriveScreenTitle("cover-art", false, "Elite"),
          "Elite > Media > Cover Art > From Catalogue",
        );
      });

      it("returns import breadcrumb", () => {
        eq(
          deriveScreenTitle("cover-art", true, "Elite", "Elite disc1"),
          "Import Games > Elite disc1 > Media > Cover Art > From Catalogue",
        );
      });
    });

    describe("screenshots flow", () => {
      it("returns standard breadcrumb", () => {
        eq(
          deriveScreenTitle("screenshots", false, "Out Run"),
          "Out Run > Media > Screenshots > From Catalogue",
        );
      });

      it("returns import breadcrumb", () => {
        eq(
          deriveScreenTitle("screenshots", true, "Out Run"),
          "Import Games > Out Run > Media > Screenshots > From Catalogue",
        );
      });
    });

    it("covers all flow values without type error", () => {
      const flows: CatalogueFlow[] = ["details", "cover-art", "screenshots"];
      for (const flow of flows) {
        const result = deriveScreenTitle(flow, false, "Test Game");
        eq(typeof result, "string");
      }
    });
  });

  describe("simulateFetch", () => {
    it("resolves GameBase64 entry 243", async () => {
      const result = await simulateFetch("game-bubble", "GameBase64", "243");
      eq(result.title, "Bubble Bobble (Taito, 1987)");
      eq(result.publisher, "Taito Corporation");
    });

    it("resolves MobyGames entry 1188", async () => {
      const result = await simulateFetch("game-bubble", "MobyGames", "1188");
      eq(result.title, "Bubble Bobble");
      eq(result.year, "1987");
    });

    it("rejects for an unknown GameBase64 entry", async () => {
      await simulateFetch("game-x", "GameBase64", "9999").then(
        () => {
          throw new Error("expected rejection");
        },
        (err: Error) => {
          eq(err.message.includes("No entry found"), true);
        },
      );
    });

    it("rejects for an unknown catalogue", async () => {
      await simulateFetch("game-x", "UnknownCat", "1").then(
        () => {
          throw new Error("expected rejection");
        },
        (err: Error) => {
          eq(err.message.includes("Unknown catalogue"), true);
        },
      );
    });
  });
});
