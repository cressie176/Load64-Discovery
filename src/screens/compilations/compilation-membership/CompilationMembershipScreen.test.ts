import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import type { MembershipGame } from "./types.ts";

function sortGamesByTitle(games: MembershipGame[]): MembershipGame[] {
	return [...games].sort((a, b) => a.sortTitle.localeCompare(b.sortTitle));
}

function getSectionKey(sortTitle: string): string {
	const first = sortTitle.charAt(0).toUpperCase();
	if (first >= "0" && first <= "9") return "0-9";
	if (first >= "A" && first <= "Z") return first;
	return "#";
}

function formatSelectedCount(count: number): string {
	return count === 1 ? "1 selected" : `${count} selected`;
}

function toggleChecked(current: Set<string>, gameId: string): Set<string> {
	const next = new Set(current);
	if (next.has(gameId)) {
		next.delete(gameId);
	} else {
		next.add(gameId);
	}
	return next;
}

function getEligibleGames(
	allGames: MembershipGame[],
	existingGameIds: Set<string>,
): MembershipGame[] {
	return allGames.filter((g) => !existingGameIds.has(g.id));
}

const SAMPLE_GAMES: MembershipGame[] = [
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
	{
		id: "game-1942",
		title: "1942",
		sortTitle: "1942",
		publisher: "Capcom",
		year: 1986,
	},
];

describe("CompilationMembershipScreen", () => {
	describe("sortGamesByTitle", () => {
		it("sorts games alphabetically by sortTitle", () => {
			const result = sortGamesByTitle(SAMPLE_GAMES);
			deep(
				result.map((g) => g.id),
				["game-1942", "game-atic", "game-boulder", "game-wizball"],
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

	describe("formatSelectedCount", () => {
		it("returns '1 selected' for a single selection", () => {
			eq(formatSelectedCount(1), "1 selected");
		});

		it("returns 'n selected' for multiple selections", () => {
			eq(formatSelectedCount(0), "0 selected");
			eq(formatSelectedCount(3), "3 selected");
		});
	});

	describe("toggleChecked", () => {
		it("adds a game id when not present", () => {
			const result = toggleChecked(new Set(), "game-1");
			ok(result.has("game-1"));
		});

		it("removes a game id when already present", () => {
			const result = toggleChecked(new Set(["game-1"]), "game-1");
			ok(!result.has("game-1"));
		});

		it("does not mutate the original set", () => {
			const original = new Set(["game-1"]);
			toggleChecked(original, "game-2");
			ok(!original.has("game-2"));
		});

		it("preserves other checked ids when toggling", () => {
			const result = toggleChecked(new Set(["game-1", "game-2"]), "game-1");
			ok(result.has("game-2"));
		});
	});

	describe("getEligibleGames", () => {
		it("excludes games already in the compilation", () => {
			const existing = new Set(["game-atic", "game-boulder"]);
			const result = getEligibleGames(SAMPLE_GAMES, existing);
			const ids = result.map((g) => g.id);
			ok(!ids.includes("game-atic"));
			ok(!ids.includes("game-boulder"));
		});

		it("includes games not yet in the compilation", () => {
			const existing = new Set(["game-atic"]);
			const result = getEligibleGames(SAMPLE_GAMES, existing);
			const ids = result.map((g) => g.id);
			ok(ids.includes("game-wizball"));
			ok(ids.includes("game-boulder"));
			ok(ids.includes("game-1942"));
		});

		it("returns all games when none are already members", () => {
			const result = getEligibleGames(SAMPLE_GAMES, new Set());
			eq(result.length, SAMPLE_GAMES.length);
		});

		it("returns empty list when all games are already members", () => {
			const existing = new Set(SAMPLE_GAMES.map((g) => g.id));
			const result = getEligibleGames(SAMPLE_GAMES, existing);
			eq(result.length, 0);
		});
	});
});
