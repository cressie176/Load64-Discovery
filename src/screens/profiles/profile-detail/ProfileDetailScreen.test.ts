import { equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_PROFILE_DETAIL } from "./seed.ts";
import type { ProfileDetailState } from "./types.ts";

function pluralise(count: number, singular: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${singular}s`;
}

function countKeyMappings(
  state: ProfileDetailState,
  profileId: string,
): number {
  return state.keyMappings.filter((m) => m.profileId === profileId).length;
}

function countEnvVars(state: ProfileDetailState, profileId: string): number {
  return state.envVars.filter((v) => v.profileId === profileId).length;
}

describe("ProfileDetailScreen", () => {
  describe("SEED_PROFILE_DETAIL", () => {
    it("has key mappings", () => {
      ok(SEED_PROFILE_DETAIL.keyMappings.length > 0);
    });

    it("each key mapping has an id, profileId, key, and action", () => {
      for (const km of SEED_PROFILE_DETAIL.keyMappings) {
        eq(typeof km.id, "string");
        eq(typeof km.profileId, "string");
        eq(typeof km.key, "string");
        eq(typeof km.action, "string");
      }
    });

    it("key mapping ids are unique", () => {
      const ids = SEED_PROFILE_DETAIL.keyMappings.map((m) => m.id);
      const unique = new Set(ids);
      eq(unique.size, ids.length);
    });

    it("each env var has an id, profileId, name, and value", () => {
      for (const ev of SEED_PROFILE_DETAIL.envVars) {
        eq(typeof ev.id, "string");
        eq(typeof ev.profileId, "string");
        eq(typeof ev.name, "string");
        eq(typeof ev.value, "string");
      }
    });

    it("env var ids are unique", () => {
      const ids = SEED_PROFILE_DETAIL.envVars.map((v) => v.id);
      const unique = new Set(ids);
      eq(unique.size, ids.length);
    });
  });

  describe("pluralise", () => {
    it("uses singular form when count is 1", () => {
      eq(pluralise(1, "controller"), "1 controller");
    });

    it("uses plural form when count is 0", () => {
      eq(pluralise(0, "controller"), "0 controllers");
    });

    it("uses plural form when count is more than 1", () => {
      eq(pluralise(3, "controller"), "3 controllers");
    });

    it("applies singular rule independently to each unit", () => {
      eq(pluralise(1, "argument"), "1 argument");
      eq(pluralise(1, "mapping"), "1 mapping");
      eq(pluralise(1, "variable"), "1 variable");
    });

    it("applies plural rule independently to each unit", () => {
      eq(pluralise(2, "argument"), "2 arguments");
      eq(pluralise(2, "mapping"), "2 mappings");
      eq(pluralise(2, "variable"), "2 variables");
    });
  });

  describe("countKeyMappings", () => {
    it("counts mappings for the given profile", () => {
      const count = countKeyMappings(SEED_PROFILE_DETAIL, "profile-default");
      eq(count, 2);
    });

    it("returns 0 for a profile with no mappings", () => {
      const count = countKeyMappings(SEED_PROFILE_DETAIL, "profile-unknown");
      eq(count, 0);
    });
  });

  describe("countEnvVars", () => {
    it("counts env vars for the given profile", () => {
      const count = countEnvVars(SEED_PROFILE_DETAIL, "profile-sid-8580");
      eq(count, 1);
    });

    it("returns 0 for a profile with no env vars", () => {
      const count = countEnvVars(SEED_PROFILE_DETAIL, "profile-unknown");
      eq(count, 0);
    });
  });
});
