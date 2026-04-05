import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_CONTROLLERS } from "./seed.ts";
import type { Controller } from "./types.ts";

function buildDisplayName(controller: Controller): string {
	if (controller.connectedCount > 1) {
		return `${controller.name} (${controller.connectedCount})`;
	}
	return controller.name;
}

function buildStatusLabel(controller: Controller): string {
	if (controller.status === "not-configured") return "Not configured";
	if (controller.status === "connected") return "Connected";
	return "Disconnected";
}

function isSelectable(controller: Controller): boolean {
	return controller.status !== "disconnected";
}

function isConfigured(controller: Controller): boolean {
	return (
		controller.status === "connected" || controller.status === "disconnected"
	);
}

function sortControllers(controllers: Controller[]): Controller[] {
	const unconfigured = controllers
		.filter((c) => c.status === "not-configured")
		.sort((a, b) => a.name.localeCompare(b.name));
	const configured = controllers
		.filter((c) => c.status !== "not-configured")
		.sort((a, b) => a.name.localeCompare(b.name));
	return [...unconfigured, ...configured];
}

function deleteController(controllers: Controller[], id: string): Controller[] {
	return controllers.filter((c) => c.id !== id);
}

describe("ControllerListScreen", () => {
	describe("SEED_CONTROLLERS", () => {
		it("has controllers", () => {
			ok(SEED_CONTROLLERS.length > 0);
		});

		it("each controller has an id, guid, name, connectedCount, and status", () => {
			for (const ctrl of SEED_CONTROLLERS) {
				eq(typeof ctrl.id, "string");
				eq(typeof ctrl.guid, "string");
				eq(typeof ctrl.name, "string");
				eq(typeof ctrl.connectedCount, "number");
				ok(
					["not-configured", "connected", "disconnected"].includes(ctrl.status),
				);
			}
		});

		it("ids are unique", () => {
			const ids = SEED_CONTROLLERS.map((c) => c.id);
			eq(new Set(ids).size, ids.length);
		});

		it("has at least one connected controller", () => {
			ok(SEED_CONTROLLERS.some((c) => c.status === "connected"));
		});

		it("has at least one disconnected controller", () => {
			ok(SEED_CONTROLLERS.some((c) => c.status === "disconnected"));
		});

		it("has at least one not-configured controller", () => {
			ok(SEED_CONTROLLERS.some((c) => c.status === "not-configured"));
		});

		it("has at least one controller with connectedCount greater than 1", () => {
			ok(SEED_CONTROLLERS.some((c) => c.connectedCount > 1));
		});
	});

	describe("buildDisplayName", () => {
		it("returns name when connectedCount is 1", () => {
			const ctrl: Controller = {
				id: "c1",
				guid: "abc",
				name: "USB Gamepad",
				deviceCount: 1,
				connectedCount: 1,
				status: "connected",
			};
			eq(buildDisplayName(ctrl), "USB Gamepad");
		});

		it("appends count in parentheses when connectedCount is greater than 1", () => {
			const ctrl: Controller = {
				id: "c1",
				guid: "abc",
				name: "Logitech Dual Action",
				deviceCount: 1,
				connectedCount: 2,
				status: "connected",
			};
			eq(buildDisplayName(ctrl), "Logitech Dual Action (2)");
		});

		it("returns name when connectedCount is 0", () => {
			const ctrl: Controller = {
				id: "c1",
				guid: "abc",
				name: "DualShock 4",
				deviceCount: 1,
				connectedCount: 0,
				status: "disconnected",
			};
			eq(buildDisplayName(ctrl), "DualShock 4");
		});
	});

	describe("buildStatusLabel", () => {
		it("returns Not configured for not-configured status", () => {
			const ctrl: Controller = {
				id: "c1",
				guid: "abc",
				name: "USB Gamepad",
				deviceCount: 1,
				connectedCount: 1,
				status: "not-configured",
			};
			eq(buildStatusLabel(ctrl), "Not configured");
		});

		it("returns Connected for connected status", () => {
			const ctrl: Controller = {
				id: "c1",
				guid: "abc",
				name: "Xbox Wireless Controller",
				deviceCount: 1,
				connectedCount: 1,
				status: "connected",
			};
			eq(buildStatusLabel(ctrl), "Connected");
		});

		it("returns Disconnected for disconnected status", () => {
			const ctrl: Controller = {
				id: "c1",
				guid: "abc",
				name: "DualShock 4",
				deviceCount: 1,
				connectedCount: 0,
				status: "disconnected",
			};
			eq(buildStatusLabel(ctrl), "Disconnected");
		});
	});

	describe("isSelectable", () => {
		it("returns true for not-configured controllers", () => {
			const ctrl: Controller = {
				id: "c1",
				guid: "abc",
				name: "USB Gamepad",
				deviceCount: 1,
				connectedCount: 1,
				status: "not-configured",
			};
			eq(isSelectable(ctrl), true);
		});

		it("returns true for connected controllers", () => {
			const ctrl: Controller = {
				id: "c1",
				guid: "abc",
				name: "Xbox Wireless Controller",
				deviceCount: 1,
				connectedCount: 1,
				status: "connected",
			};
			eq(isSelectable(ctrl), true);
		});

		it("returns false for disconnected controllers", () => {
			const ctrl: Controller = {
				id: "c1",
				guid: "abc",
				name: "DualShock 4",
				deviceCount: 1,
				connectedCount: 0,
				status: "disconnected",
			};
			eq(isSelectable(ctrl), false);
		});
	});

	describe("isConfigured", () => {
		it("returns false for not-configured controllers", () => {
			const ctrl: Controller = {
				id: "c1",
				guid: "abc",
				name: "USB Gamepad",
				deviceCount: 1,
				connectedCount: 1,
				status: "not-configured",
			};
			eq(isConfigured(ctrl), false);
		});

		it("returns true for connected controllers", () => {
			const ctrl: Controller = {
				id: "c1",
				guid: "abc",
				name: "Xbox Wireless Controller",
				deviceCount: 1,
				connectedCount: 1,
				status: "connected",
			};
			eq(isConfigured(ctrl), true);
		});

		it("returns true for disconnected controllers", () => {
			const ctrl: Controller = {
				id: "c1",
				guid: "abc",
				name: "DualShock 4",
				deviceCount: 1,
				connectedCount: 0,
				status: "disconnected",
			};
			eq(isConfigured(ctrl), true);
		});
	});

	describe("sortControllers", () => {
		it("puts unconfigured controllers before configured ones", () => {
			const controllers: Controller[] = [
				{
					id: "c1",
					guid: "a",
					name: "Xbox",
					deviceCount: 1,
					connectedCount: 1,
					status: "connected",
				},
				{
					id: "c2",
					guid: "b",
					name: "USB Gamepad",
					deviceCount: 1,
					connectedCount: 1,
					status: "not-configured",
				},
			];
			const sorted = sortControllers(controllers);
			eq(sorted[0].id, "c2");
			eq(sorted[1].id, "c1");
		});

		it("sorts unconfigured controllers alphabetically", () => {
			const controllers: Controller[] = [
				{
					id: "c1",
					guid: "a",
					name: "Zzz Pad",
					deviceCount: 1,
					connectedCount: 1,
					status: "not-configured",
				},
				{
					id: "c2",
					guid: "b",
					name: "Aaa Pad",
					deviceCount: 1,
					connectedCount: 1,
					status: "not-configured",
				},
			];
			const sorted = sortControllers(controllers);
			eq(sorted[0].id, "c2");
			eq(sorted[1].id, "c1");
		});

		it("sorts configured controllers alphabetically within their group", () => {
			const controllers: Controller[] = [
				{
					id: "c1",
					guid: "a",
					name: "Zzz Pad",
					deviceCount: 1,
					connectedCount: 1,
					status: "connected",
				},
				{
					id: "c2",
					guid: "b",
					name: "Aaa Pad",
					deviceCount: 1,
					connectedCount: 0,
					status: "disconnected",
				},
			];
			const sorted = sortControllers(controllers);
			eq(sorted[0].id, "c2");
			eq(sorted[1].id, "c1");
		});

		it("does not mutate the original array", () => {
			const controllers = [...SEED_CONTROLLERS];
			const originalIds = controllers.map((c) => c.id);
			sortControllers(controllers);
			deep(
				controllers.map((c) => c.id),
				originalIds,
			);
		});
	});

	describe("deleteController", () => {
		it("removes the controller with the matching id", () => {
			const result = deleteController(SEED_CONTROLLERS, "ctrl-dualshock4");
			const found = result.find((c) => c.id === "ctrl-dualshock4");
			eq(found, undefined);
		});

		it("preserves all other controllers", () => {
			const result = deleteController(SEED_CONTROLLERS, "ctrl-dualshock4");
			eq(result.length, SEED_CONTROLLERS.length - 1);
		});

		it("returns unchanged list when id does not exist", () => {
			const result = deleteController(SEED_CONTROLLERS, "ctrl-unknown");
			eq(result.length, SEED_CONTROLLERS.length);
		});
	});
});
