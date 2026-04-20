import { deepEqual as deq, equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImportQueue,
  formatPublisher,
  formatTitle,
  formatYear,
  selectionCount,
} from "./helpers.ts";
import { SEED_IMPORT_DISCOVERY } from "./seed.ts";
import { deriveUnrecognisedTitle } from "./title.ts";
import type { DiscoveredGame } from "./types";

function makeGame(overrides: Partial<DiscoveredGame> = {}): DiscoveredGame {
  return {
    id: "g1",
    title: "Test Game",
    publisher: "Test Pub",
    year: 2000,
    roms: ["test.d64"],
    alreadyImported: false,
    selected: true,
    ...overrides,
  };
}

describe("ImportDiscoveryScreen", () => {
  describe("deriveUnrecognisedTitle", () => {
    it("returns a dash for an empty roms array", () => {
      eq(deriveUnrecognisedTitle([]), "—");
    });

    it("returns the filename without extension for a single ROM", () => {
      eq(deriveUnrecognisedTitle(["turrican2.d64"]), "turrican2");
    });

    it("strips extension from single ROM with .tap extension", () => {
      eq(deriveUnrecognisedTitle(["game-tape.tap"]), "game-tape");
    });

    it("returns the common prefix for multiple ROMs", () => {
      eq(
        deriveUnrecognisedTitle(["last-ninja-1.d64", "last-ninja-2.d64"]),
        "last-ninja",
      );
    });

    it("strips trailing hyphens from the common prefix", () => {
      eq(
        deriveUnrecognisedTitle(["game-tape2-1.tap", "game-tape2-2.tap"]),
        "game-tape2",
      );
    });

    it("returns a dash when the common prefix reduces to empty", () => {
      eq(deriveUnrecognisedTitle(["abc.d64", "xyz.d64"]), "—");
    });

    it("handles files without an extension", () => {
      eq(deriveUnrecognisedTitle(["mygame"]), "mygame");
    });
  });

  describe("formatTitle", () => {
    it("returns the title for a recognised game", () => {
      const game = makeGame({
        title: "The Last Ninja",
        roms: ["last-ninja-1.d64"],
      });
      eq(formatTitle(game), "The Last Ninja");
    });

    it("returns the filename without extension for an unrecognised single-ROM game", () => {
      const game = makeGame({ title: null, roms: ["turrican2.d64"] });
      eq(formatTitle(game), "turrican2");
    });

    it("returns the common filename prefix for an unrecognised multi-ROM game", () => {
      const game = makeGame({
        title: null,
        roms: ["game-tape2-1.tap", "game-tape2-2.tap"],
      });
      eq(formatTitle(game), "game-tape2");
    });
  });

  describe("formatPublisher", () => {
    it("returns the publisher name when present", () => {
      eq(formatPublisher("Ocean"), "Ocean");
    });

    it("returns a dash when publisher is null", () => {
      eq(formatPublisher(null), "—");
    });
  });

  describe("formatYear", () => {
    it("returns the year as a string when present", () => {
      eq(formatYear(1987), "1987");
    });

    it("returns a dash when year is null", () => {
      eq(formatYear(null), "—");
    });
  });

  describe("selectionCount", () => {
    it("counts only selected games", () => {
      const games = [
        makeGame({ id: "a", selected: true }),
        makeGame({ id: "b", selected: false }),
        makeGame({ id: "c", selected: true }),
      ];
      eq(selectionCount(games), 2);
    });

    it("returns zero when none are selected", () => {
      const games = [makeGame({ selected: false })];
      eq(selectionCount(games), 0);
    });
  });

  describe("buildImportQueue", () => {
    it("places new games before already-imported games", () => {
      const games = [
        makeGame({
          id: "new-1",
          title: "Turrican",
          alreadyImported: false,
          selected: true,
        }),
        makeGame({
          id: "old-1",
          title: "Armalyte",
          alreadyImported: true,
          selected: true,
        }),
      ];
      const queue = buildImportQueue(games);
      eq(queue[0].id, "new-1");
      eq(queue[1].id, "old-1");
    });

    it("sorts each group alphabetically by title", () => {
      const games = [
        makeGame({
          id: "n2",
          title: "Wizball",
          alreadyImported: false,
          selected: true,
        }),
        makeGame({
          id: "n1",
          title: "Armalyte",
          alreadyImported: false,
          selected: true,
        }),
        makeGame({
          id: "o2",
          title: "Paradroid",
          alreadyImported: true,
          selected: true,
        }),
        makeGame({
          id: "o1",
          title: "International Soccer",
          alreadyImported: true,
          selected: true,
        }),
      ];
      const queue = buildImportQueue(games);
      deq(
        queue.map((c) => c.title),
        ["Armalyte", "Wizball", "International Soccer", "Paradroid"],
      );
    });

    it("excludes deselected games", () => {
      const games = [
        makeGame({ id: "a", selected: true }),
        makeGame({ id: "b", selected: false }),
      ];
      const queue = buildImportQueue(games);
      eq(queue.length, 1);
      eq(queue[0].id, "a");
    });

    it("maps roms to label/filename pairs", () => {
      const games = [
        makeGame({
          id: "g",
          roms: ["disk1.d64", "disk2.d64"],
          selected: true,
        }),
      ];
      const queue = buildImportQueue(games);
      deq(queue[0].roms, [
        { label: "Disk 1", filename: "disk1.d64" },
        { label: "Disk 2", filename: "disk2.d64" },
      ]);
    });

    it("labels a single-ROM game as Disk 1", () => {
      const games = [makeGame({ roms: ["game.d64"], selected: true })];
      const queue = buildImportQueue(games);
      deq(queue[0].roms, [{ label: "Disk 1", filename: "game.d64" }]);
    });
  });

  describe("SEED_IMPORT_DISCOVERY", () => {
    it("has a scanComplete field", () => {
      eq(typeof SEED_IMPORT_DISCOVERY.scanComplete, "boolean");
    });

    it("has a games array", () => {
      eq(Array.isArray(SEED_IMPORT_DISCOVERY.games), true);
    });

    it("includes both new and already-imported games", () => {
      const newGames = SEED_IMPORT_DISCOVERY.games.filter(
        (g) => !g.alreadyImported,
      );
      const imported = SEED_IMPORT_DISCOVERY.games.filter(
        (g) => g.alreadyImported,
      );
      eq(newGames.length > 0, true, "expected at least one new game");
      eq(
        imported.length > 0,
        true,
        "expected at least one already-imported game",
      );
    });

    it("new games are pre-selected", () => {
      const newGames = SEED_IMPORT_DISCOVERY.games.filter(
        (g) => !g.alreadyImported,
      );
      for (const g of newGames) {
        eq(g.selected, true, `expected new game ${g.id} to be pre-selected`);
      }
    });

    it("already-imported games are deselected", () => {
      const imported = SEED_IMPORT_DISCOVERY.games.filter(
        (g) => g.alreadyImported,
      );
      for (const g of imported) {
        eq(
          g.selected,
          false,
          `expected already-imported game ${g.id} to be deselected`,
        );
      }
    });

    it("all games have a roms array", () => {
      for (const g of SEED_IMPORT_DISCOVERY.games) {
        eq(Array.isArray(g.roms), true);
      }
    });

    it("unrecognised games derive a non-dash title", () => {
      const unrecognised = SEED_IMPORT_DISCOVERY.games.filter(
        (g) => g.title === null,
      );
      for (const g of unrecognised) {
        const title = deriveUnrecognisedTitle(g.roms);
        eq(title !== "—", true, `expected a derived title for ${g.id}`);
      }
    });
  });
});
