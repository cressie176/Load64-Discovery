import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import type { GameProfileRef } from "../../profiles/profile-list/types.ts";
import type { AssignedProfile } from "./types.ts";
import {
  addProfile,
  buildPendingProfiles,
  buildSaveRefs,
  cancelReorder,
  getUnassignedProfiles,
  moveProfile,
  removeProfile,
} from "./utils.ts";

const PROFILES = [
  { id: "profile-fast-load", name: "Fast Load", isDefault: true },
  { id: "profile-multiplayer", name: "Multiplayer", isDefault: false },
  { id: "profile-shmups", name: "Shmups", isDefault: false },
  { id: "profile-sid-8580", name: "SID 8580", isDefault: false },
];

const GAME_ID = "game-monty";

describe("GameProfilesSelectionScreen", () => {
  describe("buildPendingProfiles", () => {
    it("returns profiles sorted by order for the given game", () => {
      const refs: GameProfileRef[] = [
        { gameId: GAME_ID, profileId: "profile-shmups", order: 2 },
        { gameId: GAME_ID, profileId: "profile-fast-load", order: 1 },
      ];
      const result = buildPendingProfiles(refs, PROFILES, GAME_ID);
      deep(
        result.map((p) => p.id),
        ["profile-fast-load", "profile-shmups"],
      );
    });

    it("ignores refs for other games", () => {
      const refs: GameProfileRef[] = [
        { gameId: "game-other", profileId: "profile-multiplayer", order: 1 },
        { gameId: GAME_ID, profileId: "profile-shmups", order: 1 },
      ];
      const result = buildPendingProfiles(refs, PROFILES, GAME_ID);
      eq(result.length, 1);
      eq(result[0].id, "profile-shmups");
    });

    it("returns empty array when no refs exist for the game", () => {
      const result = buildPendingProfiles([], PROFILES, GAME_ID);
      eq(result.length, 0);
    });

    it("skips refs whose profile id is not found", () => {
      const refs: GameProfileRef[] = [
        { gameId: GAME_ID, profileId: "profile-unknown", order: 1 },
      ];
      const result = buildPendingProfiles(refs, PROFILES, GAME_ID);
      eq(result.length, 0);
    });

    it("preserves order values from refs", () => {
      const refs: GameProfileRef[] = [
        { gameId: GAME_ID, profileId: "profile-fast-load", order: 3 },
      ];
      const result = buildPendingProfiles(refs, PROFILES, GAME_ID);
      eq(result[0].order, 3);
    });
  });

  describe("addProfile", () => {
    it("appends profile at the end of the list", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
      ];
      const result = addProfile(pending, {
        id: "profile-multiplayer",
        name: "Multiplayer",
      });
      eq(result.length, 2);
      eq(result[1].id, "profile-multiplayer");
    });

    it("assigns order equal to the new list length", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
      ];
      const result = addProfile(pending, {
        id: "profile-multiplayer",
        name: "Multiplayer",
      });
      eq(result[1].order, 2);
    });

    it("works on an empty list", () => {
      const result = addProfile([], {
        id: "profile-fast-load",
        name: "Fast Load",
      });
      eq(result.length, 1);
      eq(result[0].order, 1);
    });

    it("does not mutate the original array", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
      ];
      addProfile(pending, { id: "profile-multiplayer", name: "Multiplayer" });
      eq(pending.length, 1);
    });
  });

  describe("removeProfile", () => {
    it("removes the profile with the given id", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
        { id: "profile-multiplayer", name: "Multiplayer", order: 2 },
      ];
      const result = removeProfile(pending, "profile-fast-load");
      eq(result.length, 1);
      eq(result[0].id, "profile-multiplayer");
    });

    it("renumbers remaining profiles consecutively from 1", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
        { id: "profile-multiplayer", name: "Multiplayer", order: 2 },
        { id: "profile-shmups", name: "Shmups", order: 3 },
      ];
      const result = removeProfile(pending, "profile-fast-load");
      deep(
        result.map((p) => p.order),
        [1, 2],
      );
    });

    it("returns empty array when removing the only profile", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
      ];
      const result = removeProfile(pending, "profile-fast-load");
      eq(result.length, 0);
    });

    it("does not mutate the original array", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
      ];
      removeProfile(pending, "profile-fast-load");
      eq(pending.length, 1);
    });
  });

  describe("moveProfile", () => {
    it("moves a profile down one position", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
        { id: "profile-multiplayer", name: "Multiplayer", order: 2 },
      ];
      const result = moveProfile(pending, 0, 1);
      eq(result[0].id, "profile-multiplayer");
      eq(result[1].id, "profile-fast-load");
    });

    it("moves a profile up one position", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
        { id: "profile-multiplayer", name: "Multiplayer", order: 2 },
      ];
      const result = moveProfile(pending, 1, -1);
      eq(result[0].id, "profile-multiplayer");
      eq(result[1].id, "profile-fast-load");
    });

    it("renumbers profiles after move", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
        { id: "profile-multiplayer", name: "Multiplayer", order: 2 },
      ];
      const result = moveProfile(pending, 0, 1);
      deep(
        result.map((p) => p.order),
        [1, 2],
      );
    });

    it("is a no-op when moving past the start of the list", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
        { id: "profile-multiplayer", name: "Multiplayer", order: 2 },
      ];
      const result = moveProfile(pending, 0, -1);
      eq(result[0].id, "profile-fast-load");
    });

    it("is a no-op when moving past the end of the list", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
        { id: "profile-multiplayer", name: "Multiplayer", order: 2 },
      ];
      const result = moveProfile(pending, 1, 1);
      eq(result[1].id, "profile-multiplayer");
    });

    it("returns original when list has fewer than 2 items", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
      ];
      const result = moveProfile(pending, 0, 1);
      eq(result, pending);
    });
  });

  describe("cancelReorder", () => {
    it("restores item to its origin position", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-multiplayer", name: "Multiplayer", order: 1 },
        { id: "profile-shmups", name: "Shmups", order: 2 },
        { id: "profile-fast-load", name: "Fast Load", order: 3 },
      ];
      // fast-load was at index 0, moved to index 2
      const result = cancelReorder(pending, 2, 0);
      eq(result[0].id, "profile-fast-load");
      eq(result[1].id, "profile-multiplayer");
      eq(result[2].id, "profile-shmups");
    });

    it("returns original when current index equals origin index", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
      ];
      const result = cancelReorder(pending, 0, 0);
      eq(result, pending);
    });

    it("renumbers profiles after cancel", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-multiplayer", name: "Multiplayer", order: 1 },
        { id: "profile-fast-load", name: "Fast Load", order: 2 },
      ];
      const result = cancelReorder(pending, 1, 0);
      deep(
        result.map((p) => p.order),
        [1, 2],
      );
    });
  });

  describe("getUnassignedProfiles", () => {
    it("returns profiles not in the pending list", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
      ];
      const result = getUnassignedProfiles(PROFILES, pending);
      ok(!result.some((p) => p.id === "profile-fast-load"));
      ok(result.some((p) => p.id === "profile-multiplayer"));
    });

    it("returns profiles sorted alphabetically by name", () => {
      const result = getUnassignedProfiles(PROFILES, []);
      const names = result.map((p) => p.name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      deep(names, sorted);
    });

    it("returns all profiles when pending list is empty", () => {
      const result = getUnassignedProfiles(PROFILES, []);
      eq(result.length, PROFILES.length);
    });

    it("returns empty array when all profiles are assigned", () => {
      const pending: AssignedProfile[] = PROFILES.map((p, i) => ({
        id: p.id,
        name: p.name,
        order: i + 1,
      }));
      const result = getUnassignedProfiles(PROFILES, pending);
      eq(result.length, 0);
    });
  });

  describe("buildSaveRefs", () => {
    it("produces a GameProfileRef for each assigned profile", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 1 },
        { id: "profile-multiplayer", name: "Multiplayer", order: 2 },
      ];
      const result = buildSaveRefs(GAME_ID, pending);
      eq(result.length, 2);
      eq(result[0].gameId, GAME_ID);
      eq(result[0].profileId, "profile-fast-load");
    });

    it("assigns consecutive order values from 1", () => {
      const pending: AssignedProfile[] = [
        { id: "profile-fast-load", name: "Fast Load", order: 99 },
        { id: "profile-multiplayer", name: "Multiplayer", order: 99 },
      ];
      const result = buildSaveRefs(GAME_ID, pending);
      deep(
        result.map((r) => r.order),
        [1, 2],
      );
    });

    it("returns empty array for empty pending list", () => {
      const result = buildSaveRefs(GAME_ID, []);
      eq(result.length, 0);
    });
  });
});
