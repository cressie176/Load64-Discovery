import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import type { GameDetails } from "../game-details/types.ts";
import type { MediaSlot } from "./types.ts";

function deriveSlotName(slot: MediaSlot): string {
  switch (slot) {
    case "cover-thumbnail":
      return "Cover Thumbnail";
    case "loading-screen":
      return "Loading Screen";
    case "title-screen":
      return "Title Screen";
    case "gameplay-screen":
      return "Gameplay Screen";
  }
}

function deriveScreenTitle(
  importMode: boolean,
  gameTitle: string,
  slotName: string,
  importTitle?: string,
  catalogueName?: string,
  entryId?: string,
): string {
  if (importMode) {
    const title = importTitle ?? gameTitle;
    const source =
      catalogueName && entryId ? ` > ${catalogueName}: ${entryId}` : "";
    return `Import > ${title} > ${slotName}${source}`;
  }
  return `${gameTitle} > Media > ${slotName}`;
}

function deriveCurrentImageUrl(
  game: GameDetails,
  slot: MediaSlot,
): string | undefined {
  if (slot === "cover-thumbnail") return game.coverUrl;
  const slotMap: Record<string, string> = {
    "loading-screen": "loading",
    "title-screen": "title",
    "gameplay-screen": "gameplay",
  };
  const screenshotSlot = slotMap[slot];
  return game.screenshots.find((s) => s.slot === screenshotSlot)?.url;
}

function deriveNextImportSlot(slot: MediaSlot): MediaSlot | null {
  const sequence: MediaSlot[] = [
    "loading-screen",
    "title-screen",
    "gameplay-screen",
    "cover-thumbnail",
  ];
  const index = sequence.indexOf(slot);
  if (index === -1 || index === sequence.length - 1) return null;
  return sequence[index + 1] ?? null;
}

const GAME: GameDetails = {
  id: "game-test",
  title: "Test Game",
  publisher: "Test Publisher",
  year: 1990,
  coverUrl: "https://example.com/cover.jpg",
  screenshots: [
    { slot: "loading", url: "https://example.com/loading.jpg" },
    { slot: "title", url: "https://example.com/title.jpg" },
    { slot: "gameplay", url: "https://example.com/gameplay.jpg" },
  ],
  sources: [],
  hasRom: true,
  hasQuickstart: false,
  hasContinue: false,
  hasAnySnapshot: false,
};

describe("GameMediaEditScreen", () => {
  describe("deriveSlotName", () => {
    it("returns Cover Thumbnail for cover-thumbnail", () => {
      eq(deriveSlotName("cover-thumbnail"), "Cover Thumbnail");
    });

    it("returns Loading Screen for loading-screen", () => {
      eq(deriveSlotName("loading-screen"), "Loading Screen");
    });

    it("returns Title Screen for title-screen", () => {
      eq(deriveSlotName("title-screen"), "Title Screen");
    });

    it("returns Gameplay Screen for gameplay-screen", () => {
      eq(deriveSlotName("gameplay-screen"), "Gameplay Screen");
    });
  });

  describe("deriveScreenTitle", () => {
    it("returns simple mode title", () => {
      eq(
        deriveScreenTitle(false, "Knight Lore", "Cover Thumbnail"),
        "Knight Lore > Media > Cover Thumbnail",
      );
    });

    it("returns import mode title with source", () => {
      eq(
        deriveScreenTitle(
          true,
          "Knight Lore",
          "Loading Screen",
          "Knight Lore",
          "GameBase64",
          "1234",
        ),
        "Import > Knight Lore > Loading Screen > GameBase64: 1234",
      );
    });

    it("returns import mode title with importTitle override", () => {
      eq(
        deriveScreenTitle(
          true,
          "Knight Lore",
          "Title Screen",
          "KNIGHT LORE",
          "MobyGames",
          "999",
        ),
        "Import > KNIGHT LORE > Title Screen > MobyGames: 999",
      );
    });

    it("returns import mode title without source when catalogueName missing", () => {
      eq(
        deriveScreenTitle(
          true,
          "Knight Lore",
          "Gameplay Screen",
          "Knight Lore",
        ),
        "Import > Knight Lore > Gameplay Screen",
      );
    });

    it("uses gameTitle as fallback in import mode when importTitle is absent", () => {
      eq(
        deriveScreenTitle(true, "Knight Lore", "Cover Thumbnail"),
        "Import > Knight Lore > Cover Thumbnail",
      );
    });
  });

  describe("deriveCurrentImageUrl", () => {
    it("returns coverUrl for cover-thumbnail", () => {
      eq(
        deriveCurrentImageUrl(GAME, "cover-thumbnail"),
        "https://example.com/cover.jpg",
      );
    });

    it("returns loading screenshot url for loading-screen", () => {
      eq(
        deriveCurrentImageUrl(GAME, "loading-screen"),
        "https://example.com/loading.jpg",
      );
    });

    it("returns title screenshot url for title-screen", () => {
      eq(
        deriveCurrentImageUrl(GAME, "title-screen"),
        "https://example.com/title.jpg",
      );
    });

    it("returns gameplay screenshot url for gameplay-screen", () => {
      eq(
        deriveCurrentImageUrl(GAME, "gameplay-screen"),
        "https://example.com/gameplay.jpg",
      );
    });

    it("returns undefined for cover-thumbnail when coverUrl is absent", () => {
      const game: GameDetails = { ...GAME, coverUrl: undefined };
      eq(deriveCurrentImageUrl(game, "cover-thumbnail"), undefined);
    });

    it("returns undefined when screenshot for slot is absent", () => {
      const game: GameDetails = { ...GAME, screenshots: [] };
      eq(deriveCurrentImageUrl(game, "loading-screen"), undefined);
    });
  });

  describe("deriveNextImportSlot", () => {
    it("returns title-screen after loading-screen", () => {
      eq(deriveNextImportSlot("loading-screen"), "title-screen");
    });

    it("returns gameplay-screen after title-screen", () => {
      eq(deriveNextImportSlot("title-screen"), "gameplay-screen");
    });

    it("returns cover-thumbnail after gameplay-screen", () => {
      eq(deriveNextImportSlot("gameplay-screen"), "cover-thumbnail");
    });

    it("returns null after cover-thumbnail", () => {
      eq(deriveNextImportSlot("cover-thumbnail"), null);
    });
  });
});
