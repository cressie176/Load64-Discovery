import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_COMPILATIONS } from "../../compilations/compilation-list/seed.ts";
import type { Compilation } from "../../compilations/compilation-list/types.ts";
import { SEED_CAROUSEL } from "./seed.ts";
import type { Game } from "./types.ts";

function sortGamesByTitle(games: Game[]): Game[] {
  return [...games].sort((a, b) => a.sortTitle.localeCompare(b.sortTitle));
}

function getGamesForCompilation(
  allGames: Game[],
  compilationId: string,
  compilationGameRefs: Array<{ compilationId: string; gameId: string }>,
  compilationKind?: string,
): Game[] {
  if (compilationKind === "all-games") {
    return sortGamesByTitle(allGames);
  }
  const ids = new Set(
    compilationGameRefs
      .filter((ref) => ref.compilationId === compilationId)
      .map((ref) => ref.gameId),
  );
  return sortGamesByTitle(allGames.filter((g) => ids.has(g.id)));
}

function getSectionStartIndex(games: Game[], letter: string): number {
  const lower = letter.toLowerCase();
  const index = games.findIndex((g) =>
    g.sortTitle.toLowerCase().startsWith(lower),
  );
  return index >= 0 ? index : -1;
}

function getSectionBoundary(
  games: Game[],
  currentIndex: number,
  direction: -1 | 1,
): number {
  if (games.length === 0) return 0;
  const currentChar = games[currentIndex]?.sortTitle[0]?.toLowerCase() ?? "";
  if (direction === 1) {
    const next = games.findIndex(
      (g, i) =>
        i > currentIndex && g.sortTitle[0]?.toLowerCase() !== currentChar,
    );
    return next >= 0 ? next : currentIndex;
  }
  let i = currentIndex - 1;
  while (i > 0 && games[i]?.sortTitle[0]?.toLowerCase() === currentChar) {
    i--;
  }
  const prevChar = games[i]?.sortTitle[0]?.toLowerCase() ?? "";
  while (i > 0 && games[i - 1]?.sortTitle[0]?.toLowerCase() === prevChar) {
    i--;
  }
  return i >= 0 ? i : 0;
}

function buildLaunchActions(game: Game): string {
  if (!game.launchable) return game.blockingReason ?? "Unlaunchable";
  const actions: string[] = [];
  if (game.hasQuickstart) actions.push("Quickstart (X | Alt+Enter)");
  if (game.hasRom) actions.push("Load (B | CTRL+Enter)");
  if (game.hasSave) actions.push("Continue (Y | Shift+Enter)");
  return actions.join(" ◆ ");
}

function buildStatusMessage(game: Game | undefined): string {
  if (!game) return "";
  return buildLaunchActions(game);
}

function wrapIndex(index: number, delta: number, length: number): number {
  return (index + delta + length) % length;
}

describe("GameCarouselScreen", () => {
  describe("SEED_CAROUSEL", () => {
    it("has games", () => {
      ok(SEED_CAROUSEL.games.length > 0);
    });

    it("each game has required fields", () => {
      for (const game of SEED_CAROUSEL.games) {
        eq(typeof game.id, "string");
        eq(typeof game.title, "string");
        eq(typeof game.sortTitle, "string");
        eq(typeof game.publisher, "string");
        eq(typeof game.year, "number");
        eq(typeof game.launchable, "boolean");
        eq(typeof game.hasRom, "boolean");
        eq(typeof game.hasQuickstart, "boolean");
        eq(typeof game.hasSave, "boolean");
      }
    });

    it("game ids are unique", () => {
      const ids = SEED_CAROUSEL.games.map((g) => g.id);
      const unique = new Set(ids);
      eq(unique.size, ids.length);
    });

    it("has at least one launchable game", () => {
      const launchable = SEED_CAROUSEL.games.filter((g) => g.launchable);
      ok(launchable.length > 0);
    });

    it("has at least one unlaunchable game", () => {
      const unlaunchable = SEED_CAROUSEL.games.filter((g) => !g.launchable);
      ok(unlaunchable.length > 0);
    });

    it("unlaunchable games have a blocking reason", () => {
      const unlaunchable = SEED_CAROUSEL.games.filter((g) => !g.launchable);
      for (const game of unlaunchable) {
        ok(game.blockingReason, `${game.id} should have a blockingReason`);
      }
    });

    it("game ids match compilationGameRefs in seed", () => {
      const gameIds = new Set(SEED_CAROUSEL.games.map((g) => g.id));
      for (const ref of SEED_COMPILATIONS.compilationGameRefs) {
        ok(
          gameIds.has(ref.gameId),
          `gameId ${ref.gameId} not found in SEED_CAROUSEL`,
        );
      }
    });

    it("has an activeCompilationId", () => {
      eq(typeof SEED_CAROUSEL.activeCompilationId, "string");
    });
  });

  describe("sortGamesByTitle", () => {
    it("sorts games alphabetically by sortTitle", () => {
      const games: Game[] = [
        {
          id: "z",
          title: "Zzap",
          sortTitle: "Zzap",
          publisher: "P",
          year: 1986,
          launchable: true,
          hasRom: true,
          hasQuickstart: false,
          hasSave: false,
        },
        {
          id: "a",
          title: "Arkanoid",
          sortTitle: "Arkanoid",
          publisher: "P",
          year: 1988,
          launchable: true,
          hasRom: true,
          hasQuickstart: false,
          hasSave: false,
        },
        {
          id: "m",
          title: "Monty",
          sortTitle: "Monty",
          publisher: "P",
          year: 1985,
          launchable: true,
          hasRom: true,
          hasQuickstart: false,
          hasSave: false,
        },
      ];
      const result = sortGamesByTitle(games);
      deep(
        result.map((g) => g.id),
        ["a", "m", "z"],
      );
    });

    it("does not mutate the original array", () => {
      const games = [...SEED_CAROUSEL.games];
      const originalIds = games.map((g) => g.id);
      sortGamesByTitle(games);
      deep(
        games.map((g) => g.id),
        originalIds,
      );
    });
  });

  describe("getGamesForCompilation", () => {
    const compilations: Compilation[] = SEED_COMPILATIONS.compilations;
    const allCompilation = compilations.find((c) => c.kind === "all-games");
    const userDefined = compilations.find((c) => c.kind === "user-defined");

    it("returns all games sorted for all-games compilation", () => {
      ok(allCompilation);
      const result = getGamesForCompilation(
        SEED_CAROUSEL.games,
        allCompilation?.id,
        SEED_COMPILATIONS.compilationGameRefs,
        "all-games",
      );
      eq(result.length, SEED_CAROUSEL.games.length);
      // should be sorted
      for (let i = 1; i < result.length; i++) {
        ok(result[i - 1]?.sortTitle.localeCompare(result[i]?.sortTitle) <= 0);
      }
    });

    it("returns only matching games for user-defined compilation", () => {
      ok(userDefined);
      const refs = SEED_COMPILATIONS.compilationGameRefs.filter(
        (r) => r.compilationId === userDefined?.id,
      );
      const result = getGamesForCompilation(
        SEED_CAROUSEL.games,
        userDefined?.id,
        SEED_COMPILATIONS.compilationGameRefs,
        "user-defined",
      );
      eq(result.length, refs.length);
    });

    it("returns empty array for compilation with no games", () => {
      const result = getGamesForCompilation(
        SEED_CAROUSEL.games,
        "compilation-empty",
        SEED_COMPILATIONS.compilationGameRefs,
        "user-defined",
      );
      eq(result.length, 0);
    });
  });

  describe("getSectionStartIndex", () => {
    const games: Game[] = [
      {
        id: "a1",
        title: "Arkanoid",
        sortTitle: "Arkanoid",
        publisher: "P",
        year: 1987,
        launchable: true,
        hasRom: true,
        hasQuickstart: false,
        hasSave: false,
      },
      {
        id: "a2",
        title: "Archon",
        sortTitle: "Archon",
        publisher: "P",
        year: 1984,
        launchable: true,
        hasRom: true,
        hasQuickstart: false,
        hasSave: false,
      },
      {
        id: "b1",
        title: "Bubble Bobble",
        sortTitle: "Bubble Bobble",
        publisher: "P",
        year: 1987,
        launchable: true,
        hasRom: true,
        hasQuickstart: false,
        hasSave: false,
      },
    ];

    it("returns the index of the first game starting with the given letter", () => {
      eq(getSectionStartIndex(games, "a"), 0);
      eq(getSectionStartIndex(games, "b"), 2);
    });

    it("returns -1 when no game starts with the given letter", () => {
      eq(getSectionStartIndex(games, "z"), -1);
    });

    it("is case-insensitive", () => {
      eq(getSectionStartIndex(games, "A"), 0);
      eq(getSectionStartIndex(games, "B"), 2);
    });
  });

  describe("getSectionBoundary", () => {
    const games: Game[] = [
      {
        id: "a1",
        title: "Archon",
        sortTitle: "Archon",
        publisher: "P",
        year: 1984,
        launchable: true,
        hasRom: true,
        hasQuickstart: false,
        hasSave: false,
      },
      {
        id: "b1",
        title: "Bubble Bobble",
        sortTitle: "Bubble Bobble",
        publisher: "P",
        year: 1987,
        launchable: true,
        hasRom: true,
        hasQuickstart: false,
        hasSave: false,
      },
      {
        id: "b2",
        title: "Bruce Lee",
        sortTitle: "Bruce Lee",
        publisher: "P",
        year: 1984,
        launchable: true,
        hasRom: true,
        hasQuickstart: false,
        hasSave: false,
      },
      {
        id: "c1",
        title: "California Games",
        sortTitle: "California Games",
        publisher: "P",
        year: 1988,
        launchable: true,
        hasRom: true,
        hasQuickstart: false,
        hasSave: false,
      },
    ];

    it("jumps forward to the first game in the next section", () => {
      eq(getSectionBoundary(games, 0, 1), 1); // from A section to B section
      eq(getSectionBoundary(games, 1, 1), 3); // from B section to C section
    });

    it("stays in place when already at the last section moving forward", () => {
      eq(getSectionBoundary(games, 3, 1), 3);
    });

    it("jumps back to the first game in the previous section", () => {
      eq(getSectionBoundary(games, 3, -1), 1); // from C to B start
    });
  });

  describe("buildStatusMessage", () => {
    it("returns empty string for undefined game", () => {
      eq(buildStatusMessage(undefined), "");
    });

    it("shows blocking reason for unlaunchable games", () => {
      const game: Game = {
        id: "g1",
        title: "Outrun",
        sortTitle: "Outrun",
        publisher: "U.S. Gold",
        year: 1988,
        launchable: false,
        blockingReason: "No ROM configured",
        hasRom: false,
        hasQuickstart: false,
        hasSave: false,
      };
      const msg = buildStatusMessage(game);
      eq(msg, "No ROM configured");
    });

    it("shows available launch actions as diamond-separated list", () => {
      const game: Game = {
        id: "g2",
        title: "Monty on the Run",
        sortTitle: "Monty on the Run",
        publisher: "Gremlin Graphics",
        year: 1985,
        launchable: true,
        hasRom: true,
        hasQuickstart: true,
        hasSave: true,
      };
      const msg = buildStatusMessage(game);
      ok(msg.includes("Quickstart (X | Alt+Enter)"));
      ok(msg.includes("Load (B | CTRL+Enter)"));
      ok(msg.includes("Continue (Y | Shift+Enter)"));
      ok(msg.includes(" ◆ "));
    });

    it("omits quickstart action when hasQuickstart is false", () => {
      const game: Game = {
        id: "g3",
        title: "Elite",
        sortTitle: "Elite",
        publisher: "Firebird",
        year: 1985,
        launchable: true,
        hasRom: true,
        hasQuickstart: false,
        hasSave: true,
      };
      const msg = buildStatusMessage(game);
      ok(!msg.includes("Quickstart"));
      ok(msg.includes("Load (B | CTRL+Enter)"));
      ok(msg.includes("Continue (Y | Shift+Enter)"));
    });

    it("omits continue action when hasSave is false", () => {
      const game: Game = {
        id: "g4",
        title: "Iridis Alpha",
        sortTitle: "Iridis Alpha",
        publisher: "Hewson Consultants",
        year: 1986,
        launchable: true,
        hasRom: true,
        hasQuickstart: true,
        hasSave: false,
      };
      const msg = buildStatusMessage(game);
      ok(!msg.includes("Continue"));
    });
  });

  describe("wrapIndex", () => {
    it("wraps forward past end", () => {
      eq(wrapIndex(4, 1, 5), 0);
    });

    it("wraps backward past start", () => {
      eq(wrapIndex(0, -1, 5), 4);
    });

    it("stays within bounds for normal movement", () => {
      eq(wrapIndex(2, 1, 5), 3);
      eq(wrapIndex(2, -1, 5), 1);
    });
  });
});
