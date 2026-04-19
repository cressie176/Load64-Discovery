import { equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_CAROUSEL } from "../../carousel/game-carousel/seed.ts";
import { SEED_GAME_DETAILS } from "./seed.ts";
import type { GameDetails, GameScreenshot } from "./types.ts";

type LaunchAction = "quickstart" | "continue" | "load-rom" | "load-snapshot";

const SCREENSHOT_SLOT_ORDER: Array<GameScreenshot["slot"]> = [
  "loading",
  "title",
  "gameplay",
];

function sortScreenshots(screenshots: GameScreenshot[]): GameScreenshot[] {
  return SCREENSHOT_SLOT_ORDER.flatMap((slot) => {
    const found = screenshots.find((s) => s.slot === slot);
    return found ? [found] : [];
  });
}

function isActionAvailable(action: LaunchAction, game: GameDetails): boolean {
  switch (action) {
    case "quickstart":
      return game.hasQuickstart && game.hasRom;
    case "continue":
      return game.hasContinue && game.hasRom;
    case "load-rom":
      return game.hasRom;
    case "load-snapshot":
      return game.hasAnySnapshot;
  }
}

function getDisabledReason(action: LaunchAction, game: GameDetails): string {
  switch (action) {
    case "quickstart":
      return "No quickstart snapshot available";
    case "continue":
      return "No eligible save snapshot available";
    case "load-rom":
      return game.hasRom
        ? ""
        : "ROM files not found. Use Manage to repair this game.";
    case "load-snapshot":
      return "No snapshots available";
  }
}

function buildBottomBarText(overrideMessage?: string): string {
  if (overrideMessage) return overrideMessage;
  return "";
}

describe("GameDetailsScreen", () => {
  describe("SEED_GAME_DETAILS", () => {
    it("has games", () => {
      ok(SEED_GAME_DETAILS.games.length > 0);
    });

    it("each game has required fields", () => {
      for (const game of SEED_GAME_DETAILS.games) {
        eq(typeof game.id, "string");
        eq(typeof game.title, "string");
        eq(typeof game.publisher, "string");
        eq(typeof game.year, "number");
        eq(typeof game.hasRom, "boolean");
        eq(typeof game.hasQuickstart, "boolean");
        eq(typeof game.hasContinue, "boolean");
        eq(typeof game.hasAnySnapshot, "boolean");
        ok(Array.isArray(game.screenshots));
        ok(Array.isArray(game.sources));
      }
    });

    it("game ids are unique", () => {
      const ids = SEED_GAME_DETAILS.games.map((g) => g.id);
      const unique = new Set(ids);
      eq(unique.size, ids.length);
    });

    it("game ids match carousel seed", () => {
      const carouselIds = new Set(SEED_CAROUSEL.games.map((g) => g.id));
      for (const game of SEED_GAME_DETAILS.games) {
        ok(
          carouselIds.has(game.id),
          `game id ${game.id} not found in SEED_CAROUSEL`,
        );
      }
    });

    it("has at least one game with a quickstart snapshot", () => {
      const withQuickstart = SEED_GAME_DETAILS.games.filter(
        (g) => g.hasQuickstart,
      );
      ok(withQuickstart.length > 0);
    });

    it("has at least one game without a ROM", () => {
      const withoutRom = SEED_GAME_DETAILS.games.filter((g) => !g.hasRom);
      ok(withoutRom.length > 0);
    });

    it("has at least one game with sources", () => {
      const withSources = SEED_GAME_DETAILS.games.filter(
        (g) => g.sources.length > 0,
      );
      ok(withSources.length > 0);
    });

    it("hasQuickstart requires hasRom", () => {
      for (const game of SEED_GAME_DETAILS.games) {
        if (game.hasQuickstart) {
          ok(
            game.hasRom,
            `game ${game.id} has quickstart but no ROM — inconsistent`,
          );
        }
      }
    });
  });

  describe("sortScreenshots", () => {
    it("orders screenshots: loading, title, gameplay", () => {
      const screenshots: GameScreenshot[] = [
        { slot: "gameplay", url: "g.png" },
        { slot: "loading", url: "l.png" },
        { slot: "title", url: "t.png" },
      ];
      const result = sortScreenshots(screenshots);
      eq(result[0]?.slot, "loading");
      eq(result[1]?.slot, "title");
      eq(result[2]?.slot, "gameplay");
    });

    it("omits missing slots", () => {
      const screenshots: GameScreenshot[] = [
        { slot: "gameplay", url: "g.png" },
      ];
      const result = sortScreenshots(screenshots);
      eq(result.length, 1);
      eq(result[0]?.slot, "gameplay");
    });

    it("returns empty array when no screenshots", () => {
      const result = sortScreenshots([]);
      eq(result.length, 0);
    });
  });

  describe("isActionAvailable", () => {
    const fullGame: GameDetails = {
      id: "g1",
      title: "Test",
      publisher: "P",
      year: 1985,
      colourEncoding: "pal",
      trueDriveEmulation: false,
      screenshots: [],
      sources: [],
      hasRom: true,
      hasQuickstart: true,
      hasContinue: true,
      hasAnySnapshot: true,
      inheritDefaultProfile: false,
    };

    const noRomGame: GameDetails = {
      id: "g2",
      title: "Test2",
      publisher: "P",
      year: 1985,
      colourEncoding: "unknown",
      trueDriveEmulation: false,
      screenshots: [],
      sources: [],
      hasRom: false,
      hasQuickstart: false,
      hasContinue: false,
      hasAnySnapshot: false,
      inheritDefaultProfile: false,
    };

    it("quickstart is available when hasRom and hasQuickstart", () => {
      eq(isActionAvailable("quickstart", fullGame), true);
    });

    it("quickstart is unavailable without ROM", () => {
      eq(isActionAvailable("quickstart", noRomGame), false);
    });

    it("continue is available when hasRom and hasContinue", () => {
      eq(isActionAvailable("continue", fullGame), true);
    });

    it("continue is unavailable without ROM", () => {
      eq(isActionAvailable("continue", noRomGame), false);
    });

    it("load-rom is available when hasRom", () => {
      eq(isActionAvailable("load-rom", fullGame), true);
    });

    it("load-rom is unavailable without ROM", () => {
      eq(isActionAvailable("load-rom", noRomGame), false);
    });

    it("load-snapshot is available when hasAnySnapshot", () => {
      eq(isActionAvailable("load-snapshot", fullGame), true);
    });

    it("load-snapshot is unavailable when no snapshots", () => {
      eq(isActionAvailable("load-snapshot", noRomGame), false);
    });
  });

  describe("getDisabledReason", () => {
    const noRomGame: GameDetails = {
      id: "g1",
      title: "Test",
      publisher: "P",
      year: 1985,
      colourEncoding: "unknown",
      trueDriveEmulation: false,
      screenshots: [],
      sources: [],
      hasRom: false,
      hasQuickstart: false,
      hasContinue: false,
      hasAnySnapshot: false,
      inheritDefaultProfile: false,
    };

    it("returns ROM message for load-rom when no ROM", () => {
      const reason = getDisabledReason("load-rom", noRomGame);
      ok(reason.includes("ROM files not found"));
      ok(reason.includes("Manage"));
    });

    it("returns quickstart message", () => {
      const reason = getDisabledReason("quickstart", noRomGame);
      ok(reason.includes("quickstart"));
    });

    it("returns continue message", () => {
      const reason = getDisabledReason("continue", noRomGame);
      ok(reason.includes("save snapshot"));
    });

    it("returns snapshot message for load-snapshot", () => {
      const reason = getDisabledReason("load-snapshot", noRomGame);
      ok(reason.includes("snapshot"));
    });
  });

  describe("buildBottomBarText", () => {
    it("returns empty string by default", () => {
      eq(buildBottomBarText(), "");
    });

    it("shows override message when provided", () => {
      const text = buildBottomBarText("No quickstart snapshot available");
      eq(text, "No quickstart snapshot available");
    });
  });
});
