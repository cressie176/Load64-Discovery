import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_COMPILATIONS } from "./seed.ts";
import type { Compilation } from "./types.ts";

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
});
