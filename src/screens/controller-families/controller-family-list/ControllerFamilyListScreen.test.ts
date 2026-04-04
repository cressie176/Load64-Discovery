import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_CONTROLLER_FAMILIES } from "../controller-family-selection/seed.ts";
import type { ControllerFamily } from "./types.ts";

function sortFamilies(families: ControllerFamily[]): ControllerFamily[] {
	return [...families].sort((a, b) => a.name.localeCompare(b.name));
}

function deleteFamily(
	families: ControllerFamily[],
	familyId: string,
): ControllerFamily[] {
	return families.filter((f) => f.id !== familyId);
}

function controllerCount(
	controllers: { familyId: string | null }[],
	familyId: string,
): number {
	return controllers.filter((c) => c.familyId === familyId).length;
}

describe("ControllerFamilyListScreen", () => {
	describe("SEED_CONTROLLER_FAMILIES", () => {
		it("has families", () => {
			ok(SEED_CONTROLLER_FAMILIES.families.length > 0);
		});

		it("each family has an id and name", () => {
			for (const family of SEED_CONTROLLER_FAMILIES.families) {
				eq(typeof family.id, "string");
				eq(typeof family.name, "string");
			}
		});

		it("family ids are unique", () => {
			const ids = SEED_CONTROLLER_FAMILIES.families.map((f) => f.id);
			const unique = new Set(ids);
			eq(unique.size, ids.length);
		});
	});

	describe("sortFamilies", () => {
		it("sorts families alphabetically by name", () => {
			const families: ControllerFamily[] = [
				{ id: "c", name: "Sony DualShock" },
				{ id: "a", name: "Logitech" },
				{ id: "b", name: "Microsoft Xbox" },
			];
			const result = sortFamilies(families);
			deep(
				result.map((f) => f.name),
				["Logitech", "Microsoft Xbox", "Sony DualShock"],
			);
		});

		it("does not mutate the original array", () => {
			const families = [...SEED_CONTROLLER_FAMILIES.families];
			const originalIds = families.map((f) => f.id);
			sortFamilies(families);
			deep(
				families.map((f) => f.id),
				originalIds,
			);
		});

		it("returns an empty array when given an empty array", () => {
			deep(sortFamilies([]), []);
		});
	});

	describe("deleteFamily", () => {
		it("removes the specified family", () => {
			const result = deleteFamily(
				SEED_CONTROLLER_FAMILIES.families,
				"family-logitech",
			);
			const found = result.find((f) => f.id === "family-logitech");
			eq(found, undefined);
		});

		it("preserves all other families", () => {
			const originalCount = SEED_CONTROLLER_FAMILIES.families.length;
			const result = deleteFamily(
				SEED_CONTROLLER_FAMILIES.families,
				"family-logitech",
			);
			eq(result.length, originalCount - 1);
		});

		it("returns the same families when id does not exist", () => {
			const result = deleteFamily(
				SEED_CONTROLLER_FAMILIES.families,
				"family-unknown",
			);
			eq(result.length, SEED_CONTROLLER_FAMILIES.families.length);
		});
	});

	describe("controllerCount", () => {
		it("counts controllers assigned to a family", () => {
			const count = controllerCount(
				SEED_CONTROLLER_FAMILIES.controllers,
				"family-logitech",
			);
			eq(count, 1);
		});

		it("returns zero for a family with no controllers", () => {
			const count = controllerCount(
				SEED_CONTROLLER_FAMILIES.controllers,
				"family-unknown",
			);
			eq(count, 0);
		});
	});
});
