import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_CONTROLLER_FAMILIES } from "./seed.ts";
import type { ControllerFamiliesState, ControllerFamily } from "./types.ts";

function buildListItems(
	families: ControllerFamily[],
): Array<{ id: string | null; label: string }> {
	const sorted = [...families].sort((a, b) => a.name.localeCompare(b.name));
	return [
		...sorted.map((f) => ({ id: f.id, label: f.name })),
		{ id: null, label: "None" },
	];
}

function resolveInitialIndex(
	items: Array<{ id: string | null; label: string }>,
	currentFamilyId: string | null,
): number {
	const index = items.findIndex((item) => item.id === currentFamilyId);
	return index >= 0 ? index : items.length - 1;
}

function assignFamily(
	state: ControllerFamiliesState,
	controllerId: string,
	familyId: string | null,
): ControllerFamiliesState {
	return {
		...state,
		controllers: state.controllers.map((c) =>
			c.id === controllerId ? { ...c, familyId } : c,
		),
	};
}

describe("ControllerFamilySelectionScreen", () => {
	describe("SEED_CONTROLLER_FAMILIES", () => {
		it("has families", () => {
			ok(SEED_CONTROLLER_FAMILIES.families.length > 0);
		});

		it("has controllers", () => {
			ok(SEED_CONTROLLER_FAMILIES.controllers.length > 0);
		});

		it("each family has an id and name", () => {
			for (const family of SEED_CONTROLLER_FAMILIES.families) {
				eq(typeof family.id, "string");
				eq(typeof family.name, "string");
			}
		});

		it("each controller has an id, deviceName, guid, and familyId", () => {
			for (const controller of SEED_CONTROLLER_FAMILIES.controllers) {
				eq(typeof controller.id, "string");
				eq(typeof controller.deviceName, "string");
				eq(typeof controller.guid, "string");
				ok(
					controller.familyId === null ||
						typeof controller.familyId === "string",
				);
			}
		});

		it("family ids are unique", () => {
			const ids = SEED_CONTROLLER_FAMILIES.families.map((f) => f.id);
			eq(new Set(ids).size, ids.length);
		});

		it("controller ids are unique", () => {
			const ids = SEED_CONTROLLER_FAMILIES.controllers.map((c) => c.id);
			eq(new Set(ids).size, ids.length);
		});
	});

	describe("buildListItems", () => {
		it("sorts families alphabetically with None last", () => {
			const families: ControllerFamily[] = [
				{ id: "f3", name: "Sony DualShock" },
				{ id: "f1", name: "Logitech" },
				{ id: "f2", name: "Microsoft Xbox" },
			];
			const items = buildListItems(families);
			deep(
				items.map((i) => i.label),
				["Logitech", "Microsoft Xbox", "Sony DualShock", "None"],
			);
		});

		it("None item has null id", () => {
			const items = buildListItems(SEED_CONTROLLER_FAMILIES.families);
			const noneItem = items[items.length - 1];
			eq(noneItem?.id, null);
			eq(noneItem?.label, "None");
		});

		it("does not mutate the original array", () => {
			const families = [...SEED_CONTROLLER_FAMILIES.families];
			const original = families.map((f) => f.id);
			buildListItems(families);
			deep(
				families.map((f) => f.id),
				original,
			);
		});
	});

	describe("resolveInitialIndex", () => {
		it("returns the index of the currently assigned family", () => {
			const items = buildListItems(SEED_CONTROLLER_FAMILIES.families);
			const logitech = items.find((i) => i.id === "family-logitech");
			ok(logitech !== undefined);
			const index = resolveInitialIndex(items, "family-logitech");
			eq(items[index]?.id, "family-logitech");
		});

		it("returns the last index (None) when no family is assigned", () => {
			const items = buildListItems(SEED_CONTROLLER_FAMILIES.families);
			const index = resolveInitialIndex(items, null);
			eq(index, items.length - 1);
		});

		it("returns the last index (None) when family id is not found", () => {
			const items = buildListItems(SEED_CONTROLLER_FAMILIES.families);
			const index = resolveInitialIndex(items, "family-unknown");
			eq(index, items.length - 1);
		});
	});

	describe("assignFamily", () => {
		it("assigns a family to a controller", () => {
			const result = assignFamily(
				SEED_CONTROLLER_FAMILIES,
				"controller-dualshock-4",
				"family-dualshock",
			);
			const updated = result.controllers.find(
				(c) => c.id === "controller-dualshock-4",
			);
			eq(updated?.familyId, "family-dualshock");
		});

		it("removes a family assignment when given null", () => {
			const result = assignFamily(
				SEED_CONTROLLER_FAMILIES,
				"controller-logitech-f310",
				null,
			);
			const updated = result.controllers.find(
				(c) => c.id === "controller-logitech-f310",
			);
			eq(updated?.familyId, null);
		});

		it("does not modify other controllers", () => {
			const result = assignFamily(
				SEED_CONTROLLER_FAMILIES,
				"controller-dualshock-4",
				"family-dualshock",
			);
			const xbox = result.controllers.find(
				(c) => c.id === "controller-xbox-360",
			);
			eq(xbox?.familyId, "family-xbox");
		});

		it("preserves all controllers", () => {
			const result = assignFamily(
				SEED_CONTROLLER_FAMILIES,
				"controller-dualshock-4",
				"family-dualshock",
			);
			eq(
				result.controllers.length,
				SEED_CONTROLLER_FAMILIES.controllers.length,
			);
		});
	});
});
