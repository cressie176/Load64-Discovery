import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_VICE_ARGUMENTS } from "./seed.ts";
import type { ViceArgumentRow, ViceArgumentsState } from "./types.ts";

function stripPrefix(name: string): string {
	return name.replace(/^[-+]/, "");
}

function compareArgumentNames(a: string, b: string): number {
	const aBase = stripPrefix(a).toLowerCase();
	const bBase = stripPrefix(b).toLowerCase();
	if (aBase !== bBase) return aBase < bBase ? -1 : 1;
	const aPrefix = a.startsWith("-") ? 0 : 1;
	const bPrefix = b.startsWith("-") ? 0 : 1;
	return aPrefix - bPrefix;
}

function buildRows(
	ownerId: string,
	viceArgumentsState: ViceArgumentsState,
): ViceArgumentRow[] {
	const owner = viceArgumentsState.owners.find((o) => o.id === ownerId);
	if (!owner) return [];

	const ownedArgs = viceArgumentsState.arguments.filter(
		(a) => a.ownerId === ownerId,
	);

	const inheritedArgs: ViceArgumentRow[] = owner.profileIds.flatMap(
		(profileId) => {
			const profile = viceArgumentsState.owners.find((o) => o.id === profileId);
			return viceArgumentsState.arguments
				.filter((a) => a.ownerId === profileId)
				.map((a) => ({
					id: a.id,
					name: a.name,
					value: a.value,
					sourceLabel: `Profile: ${profile?.name ?? profileId}`,
					isInherited: true,
					ownerId: a.ownerId,
				}));
		},
	);

	const ownedRows: ViceArgumentRow[] = ownedArgs.map((a) => ({
		id: a.id,
		name: a.name,
		value: a.value,
		sourceLabel: "—",
		isInherited: false,
		ownerId: a.ownerId,
	}));

	return [...ownedRows, ...inheritedArgs].sort((a, b) =>
		compareArgumentNames(a.name, b.name),
	);
}

describe("ViceArgumentListScreen", () => {
	describe("SEED_VICE_ARGUMENTS", () => {
		it("has owners", () => {
			ok(SEED_VICE_ARGUMENTS.owners.length > 0);
		});

		it("has arguments", () => {
			ok(SEED_VICE_ARGUMENTS.arguments.length > 0);
		});

		it("all arguments reference a valid owner", () => {
			const ownerIds = new Set(SEED_VICE_ARGUMENTS.owners.map((o) => o.id));
			for (const arg of SEED_VICE_ARGUMENTS.arguments) {
				ok(
					ownerIds.has(arg.ownerId),
					`Argument ${arg.id} references unknown owner ${arg.ownerId}`,
				);
			}
		});

		it("all profile references in owners are valid owner ids", () => {
			const ownerIds = new Set(SEED_VICE_ARGUMENTS.owners.map((o) => o.id));
			for (const owner of SEED_VICE_ARGUMENTS.owners) {
				for (const profileId of owner.profileIds) {
					ok(
						ownerIds.has(profileId),
						`Owner ${owner.id} references unknown profile ${profileId}`,
					);
				}
			}
		});

		it("each argument has an id, name, value, and ownerId", () => {
			for (const arg of SEED_VICE_ARGUMENTS.arguments) {
				eq(typeof arg.id, "string");
				eq(typeof arg.name, "string");
				eq(typeof arg.value, "string");
				eq(typeof arg.ownerId, "string");
			}
		});

		it("argument names start with - or +", () => {
			for (const arg of SEED_VICE_ARGUMENTS.arguments) {
				ok(
					arg.name.startsWith("-") || arg.name.startsWith("+"),
					`Argument ${arg.name} does not start with - or +`,
				);
			}
		});
	});

	describe("compareArgumentNames", () => {
		it("sorts alphabetically ignoring the leading prefix", () => {
			const names = ["-sidmodel", "-autostart-warp", "+confirmonexit"];
			const sorted = [...names].sort(compareArgumentNames);
			deep(sorted, ["-autostart-warp", "+confirmonexit", "-sidmodel"]);
		});

		it("puts - before + for arguments with the same base name", () => {
			eq(compareArgumentNames("-foo", "+foo"), -1);
			eq(compareArgumentNames("+foo", "-foo"), 1);
		});

		it("returns 0 for identical argument names", () => {
			eq(compareArgumentNames("-sidmodel", "-sidmodel"), 0);
		});

		it("is case-insensitive", () => {
			eq(compareArgumentNames("-Alpha", "-beta"), -1);
			eq(compareArgumentNames("-beta", "-Alpha"), 1);
		});
	});

	describe("buildRows for a profile owner", () => {
		it("returns owned rows for a profile with no profileIds", () => {
			const rows = buildRows("profile-default", SEED_VICE_ARGUMENTS);
			const ownedRows = rows.filter((r) => !r.isInherited);
			eq(ownedRows.length, 2);
		});

		it("marks owned rows with sourceLabel —", () => {
			const rows = buildRows("profile-default", SEED_VICE_ARGUMENTS);
			for (const row of rows.filter((r) => !r.isInherited)) {
				eq(row.sourceLabel, "—");
			}
		});

		it("returns no inherited rows for a profile", () => {
			const rows = buildRows("profile-default", SEED_VICE_ARGUMENTS);
			const inheritedRows = rows.filter((r) => r.isInherited);
			eq(inheritedRows.length, 0);
		});

		it("sorts rows alphabetically by name ignoring prefix", () => {
			const rows = buildRows("profile-default", SEED_VICE_ARGUMENTS);
			const names = rows.map((r) => r.name);
			deep(names, ["-autostart-warp", "+confirmonexit"]);
		});
	});

	describe("buildRows for a launch-config owner with profiles", () => {
		it("includes owned rows and inherited rows from profiles", () => {
			const rows = buildRows("launch-config-monty", SEED_VICE_ARGUMENTS);
			const ownedRows = rows.filter((r) => !r.isInherited);
			const inheritedRows = rows.filter((r) => r.isInherited);
			eq(ownedRows.length, 1);
			eq(inheritedRows.length, 3);
		});

		it("labels inherited rows with the profile name", () => {
			const rows = buildRows("launch-config-monty", SEED_VICE_ARGUMENTS);
			const inherited = rows.filter((r) => r.isInherited);
			ok(inherited.every((r) => r.sourceLabel.startsWith("Profile:")));
		});

		it("returns all rows sorted alphabetically", () => {
			const rows = buildRows("launch-config-monty", SEED_VICE_ARGUMENTS);
			const names = rows.map((r) => r.name);
			const sorted = [...names].sort(compareArgumentNames);
			deep(names, sorted);
		});
	});

	describe("buildRows for unknown owner", () => {
		it("returns empty array", () => {
			const rows = buildRows("unknown-owner", SEED_VICE_ARGUMENTS);
			deep(rows, []);
		});
	});

	describe("ViceArgumentRow", () => {
		it("owned rows have isInherited false", () => {
			const rows = buildRows("profile-default", SEED_VICE_ARGUMENTS);
			for (const row of rows) {
				eq(row.isInherited, false);
			}
		});

		it("displays — for value when value is empty", () => {
			const rows = buildRows("profile-default", SEED_VICE_ARGUMENTS);
			const noValueRow = rows.find((r) => r.name === "-autostart-warp");
			eq(noValueRow?.value, "");
		});

		it("displays actual value when value is set", () => {
			const rows = buildRows("profile-sid-8580", SEED_VICE_ARGUMENTS);
			const sidRow = rows.find((r) => r.name === "-sidmodel");
			eq(sidRow?.value, "8580");
		});
	});
});
