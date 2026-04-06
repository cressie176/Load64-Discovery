import { deepEqual, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import type { GameDetails } from "../../../screens/games/game-details/types.ts";
import type { BottomBarStatus, MediaSlots } from "./types.ts";

function normaliseName(name: string): string {
  return name.trim().toLowerCase();
}

function toFilename(name: string): string {
  return `${normaliseName(name)}.png`;
}

function isNameValid(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (/[/\\:*?"<>|]/.test(trimmed)) return false;
  return true;
}

function buildBottomBarText(status: BottomBarStatus): string {
  switch (status.kind) {
    case "idle":
      return "";
    case "saved":
      return `Screenshot saved: ${status.filename}`;
    case "error":
      return `Failed to save screenshot: ${status.reason}`;
  }
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
  describe("toFilename", () => {
    it("lowercases the name and appends .png", () => {
      eq(toFilename("Gameplay Screen"), "gameplay screen.png");
    });

    it("trims whitespace before converting", () => {
      eq(toFilename("  Loading  "), "loading.png");
    });
  });

  describe("isNameValid", () => {
    it("returns true for a plain name", () => {
      ok(isNameValid("Gameplay Screen"));
    });

    it("returns false for an empty string", () => {
      eq(isNameValid(""), false);
    });

    it("returns false for a whitespace-only string", () => {
      eq(isNameValid("   "), false);
    });

    it("returns false when name contains a forward slash", () => {
      eq(isNameValid("screen/shot"), false);
    });

    it("returns false when name contains a backslash", () => {
      eq(isNameValid("screen\\shot"), false);
    });

    it("returns false when name contains a colon", () => {
      eq(isNameValid("screen:shot"), false);
    });

    it("returns false when name contains an asterisk", () => {
      eq(isNameValid("screen*shot"), false);
    });

    it("returns false when name contains a question mark", () => {
      eq(isNameValid("screen?shot"), false);
    });

    it("returns false when name contains a double quote", () => {
      eq(isNameValid('screen"shot'), false);
    });

    it("returns false when name contains a less-than sign", () => {
      eq(isNameValid("screen<shot"), false);
    });

    it("returns false when name contains a greater-than sign", () => {
      eq(isNameValid("screen>shot"), false);
    });

    it("returns false when name contains a pipe", () => {
      eq(isNameValid("screen|shot"), false);
    });
  });

  describe("buildBottomBarText", () => {
    it("returns empty string for idle status", () => {
      eq(buildBottomBarText({ kind: "idle" }), "");
    });

    it("returns saved message with filename", () => {
      eq(
        buildBottomBarText({ kind: "saved", filename: "gameplay.png" }),
        "Screenshot saved: gameplay.png",
      );
    });

    it("returns error message with reason", () => {
      eq(
        buildBottomBarText({ kind: "error", reason: "Disk full" }),
        "Failed to save screenshot: Disk full",
      );
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
