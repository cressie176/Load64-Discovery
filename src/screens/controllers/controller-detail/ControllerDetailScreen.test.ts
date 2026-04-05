import { equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_CONTROLLER_FAMILIES } from "../../controller-families/controller-family-selection/seed.ts";
import { SEED_CONTROLLERS } from "../controller-list/seed.ts";

function buildTitle(
	deviceName: string,
	familyName: string,
	guid: string,
): string {
	return `${deviceName} - ${familyName} - ${guid}`;
}

function resolveFamilyName(
	controllerId: string,
	families: typeof SEED_CONTROLLER_FAMILIES,
): string {
	const entry = families.controllers.find((c) => c.id === controllerId);
	if (!entry || entry.familyId === null) return "(No Family)";
	const family = families.families.find((f) => f.id === entry.familyId);
	return family?.name ?? "(No Family)";
}

function isConnected(
	controllerId: string,
	controllers: typeof SEED_CONTROLLERS,
): boolean {
	const c = controllers.find((c) => c.id === controllerId);
	return c?.status === "connected";
}

describe("ControllerDetailScreen", () => {
	describe("buildTitle", () => {
		it("formats the title from device name, family name, and guid", () => {
			eq(
				buildTitle(
					"USB Gamepad",
					"Logitech",
					"030000005e040000ea02000000007803",
				),
				"USB Gamepad - Logitech - 030000005e040000ea02000000007803",
			);
		});

		it("uses (No Family) placeholder when no family is assigned", () => {
			eq(
				buildTitle(
					"DualShock 4",
					"(No Family)",
					"030000004c050000c405000011010000",
				),
				"DualShock 4 - (No Family) - 030000004c050000c405000011010000",
			);
		});
	});

	describe("resolveFamilyName", () => {
		it("returns the family name when a family is assigned", () => {
			const name = resolveFamilyName(
				"controller-logitech-f310",
				SEED_CONTROLLER_FAMILIES,
			);
			eq(name, "Logitech");
		});

		it("returns (No Family) when no family is assigned", () => {
			const name = resolveFamilyName(
				"controller-dualshock-4",
				SEED_CONTROLLER_FAMILIES,
			);
			eq(name, "(No Family)");
		});

		it("returns (No Family) for an unknown controller", () => {
			const name = resolveFamilyName(
				"unknown-controller",
				SEED_CONTROLLER_FAMILIES,
			);
			eq(name, "(No Family)");
		});
	});

	describe("isConnected", () => {
		it("returns true for a connected controller", () => {
			ok(isConnected("ctrl-logitech-dual-action", SEED_CONTROLLERS));
		});

		it("returns false for a disconnected controller", () => {
			eq(isConnected("ctrl-dualshock4", SEED_CONTROLLERS), false);
		});

		it("returns false for a not-configured controller", () => {
			eq(isConnected("ctrl-usb-gamepad", SEED_CONTROLLERS), false);
		});
	});

	describe("SEED_CONTROLLERS", () => {
		it("has at least one connected controller", () => {
			ok(SEED_CONTROLLERS.some((c) => c.status === "connected"));
		});

		it("has at least one disconnected controller", () => {
			ok(SEED_CONTROLLERS.some((c) => c.status === "disconnected"));
		});

		it("each controller has id, name, guid, and status", () => {
			for (const c of SEED_CONTROLLERS) {
				eq(typeof c.id, "string");
				eq(typeof c.name, "string");
				eq(typeof c.guid, "string");
				ok(["connected", "disconnected", "not-configured"].includes(c.status));
			}
		});
	});
});
