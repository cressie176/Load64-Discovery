import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_KEY_MAPPINGS } from "./seed.ts";
import type { KeyMappingRow, KeyMappingsState } from "./types.ts";

function buildRows(ownerId: string, state: KeyMappingsState): KeyMappingRow[] {
	const owner = state.owners.find((o) => o.id === ownerId);
	if (!owner) return [];

	const ownedMappings = state.mappings.filter((m) => m.ownerId === ownerId);

	const inheritedRows: KeyMappingRow[] = owner.profileIds.flatMap(
		(profileId) => {
			const profile = state.owners.find((o) => o.id === profileId);
			return state.mappings
				.filter((m) => m.ownerId === profileId)
				.map((m) => ({
					id: m.id,
					hostKey: m.hostKey,
					machineKey: m.machineKey,
					sourceLabel: `Profile: ${profile?.name ?? profileId}`,
					isInherited: true,
					ownerId: m.ownerId,
				}));
		},
	);

	const ownedRows: KeyMappingRow[] = ownedMappings.map((m) => ({
		id: m.id,
		hostKey: m.hostKey,
		machineKey: m.machineKey,
		sourceLabel: "—",
		isInherited: false,
		ownerId: m.ownerId,
	}));

	return [...ownedRows, ...inheritedRows].sort((a, b) =>
		a.hostKey.localeCompare(b.hostKey),
	);
}

describe("KeyMappingListScreen", () => {
	describe("SEED_KEY_MAPPINGS", () => {
		it("has owners", () => {
			ok(SEED_KEY_MAPPINGS.owners.length > 0);
		});

		it("has mappings", () => {
			ok(SEED_KEY_MAPPINGS.mappings.length > 0);
		});

		it("all mappings reference a valid owner", () => {
			const ownerIds = new Set(SEED_KEY_MAPPINGS.owners.map((o) => o.id));
			for (const mapping of SEED_KEY_MAPPINGS.mappings) {
				ok(
					ownerIds.has(mapping.ownerId),
					`Mapping ${mapping.id} references unknown owner ${mapping.ownerId}`,
				);
			}
		});

		it("all profile references in owners are valid owner ids", () => {
			const ownerIds = new Set(SEED_KEY_MAPPINGS.owners.map((o) => o.id));
			for (const owner of SEED_KEY_MAPPINGS.owners) {
				for (const profileId of owner.profileIds) {
					ok(
						ownerIds.has(profileId),
						`Owner ${owner.id} references unknown profile ${profileId}`,
					);
				}
			}
		});

		it("each mapping has an id, hostKey, machineKey, and ownerId", () => {
			for (const mapping of SEED_KEY_MAPPINGS.mappings) {
				eq(typeof mapping.id, "string");
				eq(typeof mapping.hostKey, "string");
				eq(typeof mapping.machineKey, "string");
				eq(typeof mapping.ownerId, "string");
			}
		});
	});

	describe("buildRows for a profile owner", () => {
		it("returns owned rows for a profile with no profileIds", () => {
			const rows = buildRows("profile-default", SEED_KEY_MAPPINGS);
			const ownedRows = rows.filter((r) => !r.isInherited);
			eq(ownedRows.length, 3);
		});

		it("marks owned rows with sourceLabel —", () => {
			const rows = buildRows("profile-default", SEED_KEY_MAPPINGS);
			for (const row of rows.filter((r) => !r.isInherited)) {
				eq(row.sourceLabel, "—");
			}
		});

		it("returns no inherited rows for a profile", () => {
			const rows = buildRows("profile-default", SEED_KEY_MAPPINGS);
			const inheritedRows = rows.filter((r) => r.isInherited);
			eq(inheritedRows.length, 0);
		});

		it("sorts rows alphabetically by host key", () => {
			const rows = buildRows("profile-default", SEED_KEY_MAPPINGS);
			const hostKeys = rows.map((r) => r.hostKey);
			const sorted = [...hostKeys].sort((a, b) => a.localeCompare(b));
			deep(hostKeys, sorted);
		});
	});

	describe("buildRows for a launch-config owner with profiles", () => {
		it("includes owned rows and inherited rows from profiles", () => {
			const rows = buildRows("launch-config-monty", SEED_KEY_MAPPINGS);
			const ownedRows = rows.filter((r) => !r.isInherited);
			const inheritedRows = rows.filter((r) => r.isInherited);
			eq(ownedRows.length, 1);
			eq(inheritedRows.length, 4);
		});

		it("labels inherited rows with the profile name", () => {
			const rows = buildRows("launch-config-monty", SEED_KEY_MAPPINGS);
			const inherited = rows.filter((r) => r.isInherited);
			ok(inherited.every((r) => r.sourceLabel.startsWith("Profile:")));
		});

		it("returns all rows sorted alphabetically by host key", () => {
			const rows = buildRows("launch-config-monty", SEED_KEY_MAPPINGS);
			const hostKeys = rows.map((r) => r.hostKey);
			const sorted = [...hostKeys].sort((a, b) => a.localeCompare(b));
			deep(hostKeys, sorted);
		});
	});

	describe("buildRows for unknown owner", () => {
		it("returns empty array", () => {
			const rows = buildRows("unknown-owner", SEED_KEY_MAPPINGS);
			deep(rows, []);
		});
	});

	describe("KeyMappingRow", () => {
		it("owned rows have isInherited false", () => {
			const rows = buildRows("profile-default", SEED_KEY_MAPPINGS);
			for (const row of rows) {
				eq(row.isInherited, false);
			}
		});

		it("inherited rows have isInherited true", () => {
			const rows = buildRows("launch-config-monty", SEED_KEY_MAPPINGS);
			const inherited = rows.filter((r) => r.isInherited);
			ok(inherited.length > 0);
			for (const row of inherited) {
				eq(row.isInherited, true);
			}
		});
	});
});
