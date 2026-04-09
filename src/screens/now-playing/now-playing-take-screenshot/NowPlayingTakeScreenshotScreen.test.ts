import { deepEqual, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import type { GameDetails } from "../../../screens/games/game-details/types.ts";
import type { MediaSlots } from "./types.ts";

function normaliseName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toFilename(name: string): string {
  return `${normaliseName(name)}.png`;
}

function isNameValid(name: string): boolean {
  return normaliseName(name).length > 0;
}

function applyMediaSlots(
  games: GameDetails[],
  gameId: string,
  filename: string,
  slots: MediaSlots,
): GameDetails[] {
  return games.map((game) => {
    if (game.id !== gameId) return game;
    const checkedSlots = (
      Object.entries(slots) as [keyof MediaSlots, boolean][]
    ).filter(([, checked]) => checked);
    if (checkedSlots.length === 0) return game;
    const updatedScreenshots = game.screenshots.filter(
      (s) => !slots[s.slot as keyof MediaSlots],
    );
    for (const [slot] of checkedSlots) {
      updatedScreenshots.push({ slot, url: filename });
    }
    return { ...game, screenshots: updatedScreenshots };
  });
}

describe("NowPlayingTakeScreenshotScreen", () => {
  describe("normaliseName", () => {
    it("lowercases the name", () => {
      eq(normaliseName("Gameplay"), "gameplay");
    });

    it("trims whitespace", () => {
      eq(normaliseName("  loading  "), "loading");
    });

    it("replaces spaces with hyphens", () => {
      eq(normaliseName("title screen"), "title-screen");
    });

    it("collapses multiple separators into one hyphen", () => {
      eq(normaliseName("a  b"), "a-b");
    });

    it("strips leading and trailing hyphens", () => {
      eq(normaliseName("!shot!"), "shot");
    });

    it("preserves underscores", () => {
      eq(normaliseName("my_shot"), "my_shot");
    });

    it("replaces invalid characters with hyphens", () => {
      eq(normaliseName("screen/shot"), "screen-shot");
    });
  });

  describe("toFilename", () => {
    it("normalises the name and appends .png", () => {
      eq(toFilename("gameplay"), "gameplay.png");
    });

    it("normalises mixed-case names with spaces", () => {
      eq(toFilename("Title Screen"), "title-screen.png");
    });
  });

  describe("isNameValid", () => {
    it("returns true for a plain name", () => {
      ok(isNameValid("gameplay"));
    });

    it("returns true for a name with special chars that normalise to something", () => {
      ok(isNameValid("my shot!"));
    });

    it("returns false for an empty string", () => {
      eq(isNameValid(""), false);
    });

    it("returns false for a whitespace-only string", () => {
      eq(isNameValid("   "), false);
    });

    it("returns false for a string that normalises to empty", () => {
      eq(isNameValid("!!!"), false);
    });
  });

  describe("applyMediaSlots", () => {
    const baseGame: GameDetails = {
      id: "game-1",
      title: "Test Game",
      publisher: "Test Co",
      year: 1990,
      screenshots: [],
      sources: [],
      hasRom: true,
      hasQuickstart: false,
      hasContinue: false,
      hasAnySnapshot: false,
    };

    const noSlots: MediaSlots = {
      loading: false,
      title: false,
      gameplay: false,
    };

    it("leaves games unchanged when no slots are checked", () => {
      const games = [baseGame];
      const result = applyMediaSlots(games, "game-1", "shot.png", noSlots);
      deepEqual(result, games);
    });

    it("assigns the screenshot to a single checked slot", () => {
      const games = [baseGame];
      const result = applyMediaSlots(games, "game-1", "shot.png", {
        ...noSlots,
        gameplay: true,
      });
      deepEqual(result[0].screenshots, [{ slot: "gameplay", url: "shot.png" }]);
    });

    it("assigns the screenshot to multiple checked slots", () => {
      const games = [baseGame];
      const result = applyMediaSlots(games, "game-1", "shot.png", {
        loading: true,
        title: true,
        gameplay: false,
      });
      const slots = result[0].screenshots.map((s) => s.slot).sort();
      deepEqual(slots, ["loading", "title"]);
      ok(result[0].screenshots.every((s) => s.url === "shot.png"));
    });

    it("replaces an existing screenshot for a checked slot", () => {
      const game: GameDetails = {
        ...baseGame,
        screenshots: [{ slot: "gameplay", url: "old.png" }],
      };
      const result = applyMediaSlots([game], "game-1", "new.png", {
        ...noSlots,
        gameplay: true,
      });
      deepEqual(result[0].screenshots, [{ slot: "gameplay", url: "new.png" }]);
    });

    it("does not modify other games", () => {
      const otherGame: GameDetails = { ...baseGame, id: "game-2" };
      const result = applyMediaSlots(
        [baseGame, otherGame],
        "game-1",
        "shot.png",
        { ...noSlots, gameplay: true },
      );
      deepEqual(result[1], otherGame);
    });

    it("preserves unchecked slot assignments", () => {
      const game: GameDetails = {
        ...baseGame,
        screenshots: [{ slot: "loading", url: "loader.png" }],
      };
      const result = applyMediaSlots([game], "game-1", "new.png", {
        ...noSlots,
        gameplay: true,
      });
      const slots = result[0].screenshots.map((s) => s.slot).sort();
      deepEqual(slots, ["gameplay", "loading"]);
    });
  });
});
