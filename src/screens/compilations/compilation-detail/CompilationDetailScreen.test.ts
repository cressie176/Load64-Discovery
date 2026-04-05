import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import type { CompilationDetailGame } from "./types.ts";

function sortGamesByTitle(
	games: CompilationDetailGame[],
): CompilationDetailGame[] {
	return [...games].sort((a, b) => a.sortTitle.localeCompare(b.sortTitle));
}

function getSectionKey(sortTitle: string): string {
	const first = sortTitle.charAt(0).toUpperCase();
	if (first >= "0" && first <= "9") return "0-9";
	if (first >= "A" && first <= "Z") return first;
	return "#";
}

function formatCount(count: number): string {
	return count === 1 ? "1 game" : `${count} games`;
}

function removeGame(
	compilationGameRefs: { compilationId: string; gameId: string }[],
	compilationId: string,
	gameId: string,
): { compilationId: string; gameId: string }[] {
	return compilationGameRefs.filter(
		(ref) => !(ref.compilationId === compilationId && ref.gameId === gameId),
	);
}

const SAMPLE_GAMES: CompilationDetailGame[] = [
	{
		id: "game-wizball",
		title: "Wizball",
		sortTitle: "Wizball",
		publisher: "Ocean",
		year: 1987,
	},
	{
		id: "game-atic",
		title: "Atic Atac",
		sortTitle: "Atic Atac",
		publisher: "Ultimate Play the Game",
		year: 1983,
	},
	{
		id: "game-boulder",
		title: "Boulder Dash II",
		sortTitle: "Boulder Dash II",
		publisher: "First Star Software",
		year: 1985,
	},
];

describe("CompilationDetailScreen", () => {
	describe("sortGamesByTitle", () => {
		it("sorts games alphabetically by sortTitle", () => {
			const result = sortGamesByTitle(SAMPLE_GAMES);
			deep(
				result.map((g) => g.title),
				["Atic Atac", "Boulder Dash II", "Wizball"],
			);
		});

		it("does not mutate the original array", () => {
			const original = [...SAMPLE_GAMES];
			const originalIds = original.map((g) => g.id);
			sortGamesByTitle(original);
			deep(
				original.map((g) => g.id),
				originalIds,
			);
		});
	});

	describe("getSectionKey", () => {
		it("returns the uppercase letter for letter-starting sort titles", () => {
			eq(getSectionKey("Atic Atac"), "A");
			eq(getSectionKey("Boulder Dash"), "B");
			eq(getSectionKey("Wizball"), "W");
		});

		it("returns '0-9' for digit-starting sort titles", () => {
			eq(getSectionKey("1942"), "0-9");
			eq(getSectionKey("720"), "0-9");
		});

		it("returns '#' for non-alphanumeric starting characters", () => {
			eq(getSectionKey("!Boom"), "#");
		});
	});

	describe("formatCount", () => {
		it("returns '1 game' for a single game", () => {
			eq(formatCount(1), "1 game");
		});

		it("returns 'n games' for zero or multiple games", () => {
			eq(formatCount(0), "0 games");
			eq(formatCount(3), "3 games");
		});
	});

	describe("removeGame", () => {
		const refs = [
			{ compilationId: "comp-a", gameId: "game-1" },
			{ compilationId: "comp-a", gameId: "game-2" },
			{ compilationId: "comp-b", gameId: "game-1" },
		];

		it("removes the matching ref", () => {
			const result = removeGame(refs, "comp-a", "game-1");
			const found = result.find(
				(r) => r.compilationId === "comp-a" && r.gameId === "game-1",
			);
			eq(found, undefined);
		});

		it("preserves refs from other compilations", () => {
			const result = removeGame(refs, "comp-a", "game-1");
			ok(
				result.some(
					(r) => r.compilationId === "comp-b" && r.gameId === "game-1",
				),
			);
		});

		it("preserves other games in the same compilation", () => {
			const result = removeGame(refs, "comp-a", "game-1");
			ok(
				result.some(
					(r) => r.compilationId === "comp-a" && r.gameId === "game-2",
				),
			);
		});

		it("returns same refs when game is not found", () => {
			const result = removeGame(refs, "comp-a", "game-99");
			eq(result.length, refs.length);
		});
	});
});
