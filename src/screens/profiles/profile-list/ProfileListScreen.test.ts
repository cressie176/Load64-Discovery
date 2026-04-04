import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_PROFILES } from "./seed.ts";
import type { Profile, ProfilesState } from "./types.ts";

function sortProfiles(profiles: Profile[]): Profile[] {
	return [...profiles].sort((a, b) => a.name.localeCompare(b.name));
}

function buildContextMenuItems(profile: Profile | undefined): string[] {
	if (!profile) return ["Rename", "Delete"];
	const items: string[] = [];
	if (!profile.isDefault) items.push("Set Default");
	items.push("Rename");
	items.push("Delete");
	return items;
}

function applySetDefault(
	state: ProfilesState,
	profileId: string,
): ProfilesState {
	return {
		...state,
		profiles: state.profiles.map((p) => ({
			...p,
			isDefault: p.id === profileId,
		})),
	};
}

function deleteProfile(state: ProfilesState, profileId: string): ProfilesState {
	return {
		...state,
		profiles: state.profiles.filter((p) => p.id !== profileId),
	};
}

describe("ProfileListScreen", () => {
	describe("SEED_PROFILES", () => {
		it("has profiles", () => {
			ok(SEED_PROFILES.profiles.length > 0);
		});

		it("each profile has an id, name, and isDefault flag", () => {
			for (const profile of SEED_PROFILES.profiles) {
				eq(typeof profile.id, "string");
				eq(typeof profile.name, "string");
				eq(typeof profile.isDefault, "boolean");
			}
		});

		it("has exactly one default profile", () => {
			const defaults = SEED_PROFILES.profiles.filter((p) => p.isDefault);
			eq(defaults.length, 1);
		});

		it("profile ids are unique", () => {
			const ids = SEED_PROFILES.profiles.map((p) => p.id);
			const unique = new Set(ids);
			eq(unique.size, ids.length);
		});
	});

	describe("sortProfiles", () => {
		it("sorts profiles alphabetically by name", () => {
			const profiles: Profile[] = [
				{ id: "c", name: "Shmups", isDefault: false },
				{ id: "a", name: "Default", isDefault: true },
				{ id: "b", name: "Multiplayer", isDefault: false },
			];
			const sorted = sortProfiles(profiles);
			deep(
				sorted.map((p) => p.name),
				["Default", "Multiplayer", "Shmups"],
			);
		});

		it("does not mutate the original array", () => {
			const profiles = [...SEED_PROFILES.profiles];
			const original = profiles.map((p) => p.id);
			sortProfiles(profiles);
			deep(
				profiles.map((p) => p.id),
				original,
			);
		});
	});

	describe("buildContextMenuItems", () => {
		it("includes Set Default when profile is not the default", () => {
			const profile: Profile = {
				id: "p1",
				name: "Multiplayer",
				isDefault: false,
			};
			const items = buildContextMenuItems(profile);
			ok(items.includes("Set Default"));
		});

		it("excludes Set Default when profile is already the default", () => {
			const profile: Profile = { id: "p1", name: "Default", isDefault: true };
			const items = buildContextMenuItems(profile);
			ok(!items.includes("Set Default"));
		});

		it("always includes Rename and Delete", () => {
			const profile: Profile = { id: "p1", name: "Default", isDefault: true };
			const items = buildContextMenuItems(profile);
			ok(items.includes("Rename"));
			ok(items.includes("Delete"));
		});

		it("Set Default appears before Rename and Delete", () => {
			const profile: Profile = {
				id: "p1",
				name: "Multiplayer",
				isDefault: false,
			};
			const items = buildContextMenuItems(profile);
			const setDefaultIndex = items.indexOf("Set Default");
			const renameIndex = items.indexOf("Rename");
			const deleteIndex = items.indexOf("Delete");
			ok(setDefaultIndex < renameIndex);
			ok(renameIndex < deleteIndex);
		});
	});

	describe("applySetDefault", () => {
		it("marks the specified profile as default", () => {
			const result = applySetDefault(SEED_PROFILES, "profile-multiplayer");
			const updated = result.profiles.find(
				(p) => p.id === "profile-multiplayer",
			);
			eq(updated?.isDefault, true);
		});

		it("clears the default flag from all other profiles", () => {
			const result = applySetDefault(SEED_PROFILES, "profile-multiplayer");
			const others = result.profiles.filter(
				(p) => p.id !== "profile-multiplayer",
			);
			for (const profile of others) {
				eq(profile.isDefault, false);
			}
		});

		it("results in exactly one default profile", () => {
			const result = applySetDefault(SEED_PROFILES, "profile-shmups");
			const defaults = result.profiles.filter((p) => p.isDefault);
			eq(defaults.length, 1);
		});
	});

	describe("deleteProfile", () => {
		it("removes the specified profile", () => {
			const result = deleteProfile(SEED_PROFILES, "profile-multiplayer");
			const found = result.profiles.find((p) => p.id === "profile-multiplayer");
			eq(found, undefined);
		});

		it("preserves all other profiles", () => {
			const originalCount = SEED_PROFILES.profiles.length;
			const result = deleteProfile(SEED_PROFILES, "profile-multiplayer");
			eq(result.profiles.length, originalCount - 1);
		});

		it("returns the same state when profile does not exist", () => {
			const result = deleteProfile(SEED_PROFILES, "profile-unknown");
			eq(result.profiles.length, SEED_PROFILES.profiles.length);
		});
	});
});
