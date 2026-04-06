import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_CAROUSEL } from "../../carousel/game-carousel/seed.ts";
import type { Game } from "../../carousel/game-carousel/types.ts";
import { SEED_COMPILATIONS } from "./seed.ts";
import type { Compilation, CompilationGameRef } from "./types.ts";

function sortCompilationsForAdmin(compilations: Compilation[]): Compilation[] {
  const untested = compilations.filter((c) => c.kind === "untested");
  const userDefined = compilations
    .filter((c) => c.kind === "user-defined")
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...untested, ...userDefined];
}

function sortCompilationsForBrowse(compilations: Compilation[]): Compilation[] {
  const allGames = compilations.filter((c) => c.kind === "all-games");
  const untested = compilations.filter((c) => c.kind === "untested");
  const userDefined = compilations
    .filter((c) => c.kind === "user-defined")
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...allGames, ...untested, ...userDefined];
}

function deleteCompilation(
  compilations: Compilation[],
  compilationId: string,
): Compilation[] {
  return compilations.filter((c) => c.id !== compilationId);
}

interface CompilationStats {
  working: number;
  broken: number;
  total: number;
}

function countCompilationStats(
  compilation: Compilation,
  allGames: Game[],
  compilationGameRefs: CompilationGameRef[],
): CompilationStats {
  const games =
    compilation.kind === "all-games"
      ? allGames
      : compilationGameRefs
          .filter((ref) => ref.compilationId === compilation.id)
          .map((ref) => allGames.find((g) => g.id === ref.gameId))
          .filter((g) => g !== undefined);
  const working = games.filter((g) => g.hasRom).length;
  return { working, broken: games.length - working, total: games.length };
}

describe("CompilationListScreen", () => {
  describe("SEED_COMPILATIONS", () => {
    it("has compilations", () => {
      ok(SEED_COMPILATIONS.compilations.length > 0);
    });

    it("each compilation has an id, name, and kind", () => {
      for (const compilation of SEED_COMPILATIONS.compilations) {
        eq(typeof compilation.id, "string");
        eq(typeof compilation.name, "string");
        ok(
          ["all-games", "untested", "user-defined"].includes(compilation.kind),
        );
      }
    });

    it("has exactly one all-games compilation", () => {
      const allGames = SEED_COMPILATIONS.compilations.filter(
        (c) => c.kind === "all-games",
      );
      eq(allGames.length, 1);
    });

    it("has exactly one untested compilation", () => {
      const untested = SEED_COMPILATIONS.compilations.filter(
        (c) => c.kind === "untested",
      );
      eq(untested.length, 1);
    });

    it("has at least one user-defined compilation", () => {
      const userDefined = SEED_COMPILATIONS.compilations.filter(
        (c) => c.kind === "user-defined",
      );
      ok(userDefined.length > 0);
    });

    it("compilation ids are unique", () => {
      const ids = SEED_COMPILATIONS.compilations.map((c) => c.id);
      const unique = new Set(ids);
      eq(unique.size, ids.length);
    });
  });

  describe("sortCompilationsForAdmin", () => {
    it("places untested first, user-defined after, excludes all-games", () => {
      const compilations: Compilation[] = [
        { id: "ud1", name: "Multiplayer", kind: "user-defined" },
        { id: "ag", name: "All Games", kind: "all-games" },
        { id: "ut", name: "Untested Games", kind: "untested" },
        { id: "ud2", name: "Favourites", kind: "user-defined" },
      ];
      const result = sortCompilationsForAdmin(compilations);
      deep(
        result.map((c) => c.name),
        ["Untested Games", "Favourites", "Multiplayer"],
      );
    });

    it("sorts user-defined compilations alphabetically", () => {
      const compilations: Compilation[] = [
        { id: "ut", name: "Untested Games", kind: "untested" },
        { id: "c", name: "Shoot-em-ups", kind: "user-defined" },
        { id: "a", name: "Favourites", kind: "user-defined" },
        { id: "b", name: "Multiplayer", kind: "user-defined" },
      ];
      const result = sortCompilationsForAdmin(compilations);
      deep(
        result.map((c) => c.name),
        ["Untested Games", "Favourites", "Multiplayer", "Shoot-em-ups"],
      );
    });

    it("does not mutate the original array", () => {
      const compilations = [...SEED_COMPILATIONS.compilations];
      const originalIds = compilations.map((c) => c.id);
      sortCompilationsForAdmin(compilations);
      deep(
        compilations.map((c) => c.id),
        originalIds,
      );
    });
  });

  describe("sortCompilationsForBrowse", () => {
    it("places all-games first, untested second, user-defined after", () => {
      const compilations: Compilation[] = [
        { id: "ud1", name: "Multiplayer", kind: "user-defined" },
        { id: "ag", name: "All Games", kind: "all-games" },
        { id: "ut", name: "Untested Games", kind: "untested" },
        { id: "ud2", name: "Favourites", kind: "user-defined" },
      ];
      const result = sortCompilationsForBrowse(compilations);
      deep(
        result.map((c) => c.name),
        ["All Games", "Untested Games", "Favourites", "Multiplayer"],
      );
    });

    it("sorts user-defined compilations alphabetically", () => {
      const compilations: Compilation[] = [
        { id: "ag", name: "All Games", kind: "all-games" },
        { id: "ut", name: "Untested Games", kind: "untested" },
        { id: "c", name: "Shoot-em-ups", kind: "user-defined" },
        { id: "a", name: "Favourites", kind: "user-defined" },
        { id: "b", name: "Multiplayer", kind: "user-defined" },
      ];
      const result = sortCompilationsForBrowse(compilations);
      deep(
        result.map((c) => c.name),
        [
          "All Games",
          "Untested Games",
          "Favourites",
          "Multiplayer",
          "Shoot-em-ups",
        ],
      );
    });

    it("does not mutate the original array", () => {
      const compilations = [...SEED_COMPILATIONS.compilations];
      const originalIds = compilations.map((c) => c.id);
      sortCompilationsForBrowse(compilations);
      deep(
        compilations.map((c) => c.id),
        originalIds,
      );
    });
  });

  describe("deleteCompilation", () => {
    it("removes the specified compilation", () => {
      const result = deleteCompilation(
        SEED_COMPILATIONS.compilations,
        "compilation-favourites",
      );
      const found = result.find((c) => c.id === "compilation-favourites");
      eq(found, undefined);
    });

    it("preserves all other compilations", () => {
      const originalCount = SEED_COMPILATIONS.compilations.length;
      const result = deleteCompilation(
        SEED_COMPILATIONS.compilations,
        "compilation-favourites",
      );
      eq(result.length, originalCount - 1);
    });

    it("returns the same compilations when id does not exist", () => {
      const result = deleteCompilation(
        SEED_COMPILATIONS.compilations,
        "compilation-unknown",
      );
      eq(result.length, SEED_COMPILATIONS.compilations.length);
    });
  });

  describe("countCompilationStats", () => {
    const allGames = SEED_CAROUSEL.games;
    const refs = SEED_COMPILATIONS.compilationGameRefs;

    it("counts all games for an all-games compilation", () => {
      const compilation: Compilation = {
        id: "compilation-all-games",
        name: "All Games",
        kind: "all-games",
      };
      const stats = countCompilationStats(compilation, allGames, refs);
      eq(stats.total, allGames.length);
      eq(stats.working + stats.broken, allGames.length);
    });

    it("working + broken equals total for all-games", () => {
      const compilation: Compilation = {
        id: "compilation-all-games",
        name: "All Games",
        kind: "all-games",
      };
      const { working, broken, total } = countCompilationStats(
        compilation,
        allGames,
        refs,
      );
      eq(working + broken, total);
    });

    it("counts only games belonging to a user-defined compilation", () => {
      const compilation: Compilation = {
        id: "compilation-favourites",
        name: "Favourites",
        kind: "user-defined",
      };
      const stats = countCompilationStats(compilation, allGames, refs);
      const expectedTotal = refs.filter(
        (r) => r.compilationId === "compilation-favourites",
      ).length;
      eq(stats.total, expectedTotal);
    });

    it("working + broken equals total for a user-defined compilation", () => {
      const compilation: Compilation = {
        id: "compilation-favourites",
        name: "Favourites",
        kind: "user-defined",
      };
      const { working, broken, total } = countCompilationStats(
        compilation,
        allGames,
        refs,
      );
      eq(working + broken, total);
    });

    it("counts working as games with hasRom true", () => {
      const games: Game[] = [
        {
          id: "g1",
          title: "A",
          sortTitle: "A",
          publisher: "P",
          year: 1985,
          launchable: true,
          hasRom: true,
          hasQuickstart: false,
          hasSave: false,
        },
        {
          id: "g2",
          title: "B",
          sortTitle: "B",
          publisher: "P",
          year: 1986,
          launchable: false,
          hasRom: false,
          hasQuickstart: false,
          hasSave: false,
        },
        {
          id: "g3",
          title: "C",
          sortTitle: "C",
          publisher: "P",
          year: 1987,
          launchable: true,
          hasRom: true,
          hasQuickstart: false,
          hasSave: false,
        },
      ];
      const testRefs: CompilationGameRef[] = [
        { compilationId: "c1", gameId: "g1" },
        { compilationId: "c1", gameId: "g2" },
        { compilationId: "c1", gameId: "g3" },
      ];
      const compilation: Compilation = {
        id: "c1",
        name: "Test",
        kind: "user-defined",
      };
      const stats = countCompilationStats(compilation, games, testRefs);
      eq(stats.working, 2);
      eq(stats.broken, 1);
      eq(stats.total, 3);
    });

    it("returns zero counts for an empty compilation", () => {
      const compilation: Compilation = {
        id: "compilation-sports",
        name: "Sports",
        kind: "user-defined",
      };
      const stats = countCompilationStats(compilation, allGames, refs);
      eq(stats.working, 0);
      eq(stats.broken, 0);
      eq(stats.total, 0);
    });
  });
});
