import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_PROFILE_DETAIL } from "../../profiles/profile-detail/seed.ts";
import type { ProfileDetailState } from "../../profiles/profile-detail/types.ts";
import { SEED_CONTROLLERS } from "../controller-list/seed.ts";
import type { Controller } from "../controller-list/types.ts";

function sortConfiguredControllers(controllers: Controller[]): Controller[] {
	return [...controllers]
		.filter((c) => c.status !== "not-configured")
		.sort((a, b) => a.name.localeCompare(b.name));
}

function buildPendingSet(
	controllers: Controller[],
	assignedIds: Set<string>,
): Set<string> {
	const pending = new Set<string>();
	for (const c of controllers) {
		if (assignedIds.has(c.id)) {
			pending.add(c.id);
		}
	}
	return pending;
}

function toggleEntry(pending: Set<string>, id: string): Set<string> {
	const next = new Set(pending);
	if (next.has(id)) {
		next.delete(id);
	} else {
		next.add(id);
	}
	return next;
}

function saveAssignments(
	state: ProfileDetailState,
	profileId: string,
	pending: Set<string>,
): ProfileDetailState {
	const otherRefs = state.controllerRefs.filter(
		(r) => r.profileId !== profileId,
	);
	const newRefs = Array.from(pending).map((controllerId) => ({
		profileId,
		controllerId,
	}));
	return {
		...state,
		controllerRefs: [...otherRefs, ...newRefs],
	};
}

describe("ControllerSelectionScreen", () => {
	describe("sortConfiguredControllers", () => {
		it("excludes not-configured controllers", () => {
			const controllers: Controller[] = [
				{
					id: "c1",
					guid: "a",
					name: "Xbox",
					connectedCount: 1,
					status: "connected",
				},
				{
					id: "c2",
					guid: "b",
					name: "USB Pad",
					connectedCount: 1,
					status: "not-configured",
				},
			];
			const result = sortConfiguredControllers(controllers);
			eq(result.length, 1);
			eq(result[0]?.id, "c1");
		});

		it("includes disconnected controllers", () => {
			const controllers: Controller[] = [
				{
					id: "c1",
					guid: "a",
					name: "DualShock 4",
					connectedCount: 0,
					status: "disconnected",
				},
			];
			const result = sortConfiguredControllers(controllers);
			eq(result.length, 1);
		});

		it("sorts alphabetically by name", () => {
			const controllers: Controller[] = [
				{
					id: "c1",
					guid: "a",
					name: "Zzz Pad",
					connectedCount: 1,
					status: "connected",
				},
				{
					id: "c2",
					guid: "b",
					name: "Aaa Pad",
					connectedCount: 0,
					status: "disconnected",
				},
			];
			const result = sortConfiguredControllers(controllers);
			eq(result[0]?.id, "c2");
			eq(result[1]?.id, "c1");
		});

		it("does not mutate the original array", () => {
			const controllers = [...SEED_CONTROLLERS];
			const originalIds = controllers.map((c) => c.id);
			sortConfiguredControllers(controllers);
			deep(
				controllers.map((c) => c.id),
				originalIds,
			);
		});

		it("returns configured controllers from seed data", () => {
			const result = sortConfiguredControllers(SEED_CONTROLLERS);
			ok(result.every((c) => c.status !== "not-configured"));
		});
	});

	describe("buildPendingSet", () => {
		it("includes controllers whose ids are in the assigned set", () => {
			const controllers: Controller[] = [
				{
					id: "c1",
					guid: "a",
					name: "Xbox",
					connectedCount: 1,
					status: "connected",
				},
				{
					id: "c2",
					guid: "b",
					name: "DualShock",
					connectedCount: 0,
					status: "disconnected",
				},
			];
			const assigned = new Set(["c1"]);
			const pending = buildPendingSet(controllers, assigned);
			ok(pending.has("c1"));
			ok(!pending.has("c2"));
		});

		it("returns empty set when no controllers are assigned", () => {
			const controllers: Controller[] = [
				{
					id: "c1",
					guid: "a",
					name: "Xbox",
					connectedCount: 1,
					status: "connected",
				},
			];
			const pending = buildPendingSet(controllers, new Set());
			eq(pending.size, 0);
		});

		it("ignores assigned ids not present in the controller list", () => {
			const controllers: Controller[] = [
				{
					id: "c1",
					guid: "a",
					name: "Xbox",
					connectedCount: 1,
					status: "connected",
				},
			];
			const assigned = new Set(["c1", "c-unknown"]);
			const pending = buildPendingSet(controllers, assigned);
			eq(pending.size, 1);
			ok(pending.has("c1"));
		});
	});

	describe("toggleEntry", () => {
		it("adds an id that is not in the set", () => {
			const pending = new Set<string>(["c1"]);
			const result = toggleEntry(pending, "c2");
			ok(result.has("c2"));
			ok(result.has("c1"));
		});

		it("removes an id that is already in the set", () => {
			const pending = new Set<string>(["c1", "c2"]);
			const result = toggleEntry(pending, "c1");
			ok(!result.has("c1"));
			ok(result.has("c2"));
		});

		it("does not mutate the original set", () => {
			const pending = new Set<string>(["c1"]);
			toggleEntry(pending, "c2");
			ok(!pending.has("c2"));
		});
	});

	describe("saveAssignments", () => {
		it("replaces refs for the given profile with the pending set", () => {
			const result = saveAssignments(
				SEED_PROFILE_DETAIL,
				"profile-default",
				new Set(["ctrl-logitech-dual-action"]),
			);
			const refs = result.controllerRefs.filter(
				(r) => r.profileId === "profile-default",
			);
			eq(refs.length, 1);
			eq(refs[0]?.controllerId, "ctrl-logitech-dual-action");
		});

		it("preserves refs for other profiles", () => {
			const result = saveAssignments(
				SEED_PROFILE_DETAIL,
				"profile-default",
				new Set(["ctrl-logitech-dual-action"]),
			);
			const multiplayerRefs = result.controllerRefs.filter(
				(r) => r.profileId === "profile-multiplayer",
			);
			eq(multiplayerRefs.length, 2);
		});

		it("removes all assignments when pending set is empty", () => {
			const result = saveAssignments(
				SEED_PROFILE_DETAIL,
				"profile-default",
				new Set(),
			);
			const refs = result.controllerRefs.filter(
				(r) => r.profileId === "profile-default",
			);
			eq(refs.length, 0);
		});

		it("does not mutate the original state", () => {
			const originalLength = SEED_PROFILE_DETAIL.controllerRefs.length;
			saveAssignments(
				SEED_PROFILE_DETAIL,
				"profile-default",
				new Set(["ctrl-logitech-dual-action"]),
			);
			eq(SEED_PROFILE_DETAIL.controllerRefs.length, originalLength);
		});
	});
});
