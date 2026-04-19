import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import type { GameProfilesSelectionRow } from "./types.ts";

type Profile = { id: string; name: string; isDefault: boolean };

function buildRows(profiles: Profile[]): GameProfilesSelectionRow[] {
  const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name));
  const defaultProfile = profiles.find((p) => p.isDefault);

  const namedRows: GameProfilesSelectionRow[] = sorted.map((p) => ({
    kind: "profile",
    id: p.id,
    name: p.name,
  }));

  if (!defaultProfile) {
    return namedRows;
  }

  return [
    ...namedRows,
    {
      kind: "section-heading",
      label: "Automatically inherit configuration from the default profiles:",
    },
    { kind: "default-profile", defaultProfileName: defaultProfile.name },
  ];
}

function isRowChecked(
  row: GameProfilesSelectionRow,
  pendingDefaultProfile: boolean,
  pendingProfileIds: Set<string>,
): boolean {
  if (row.kind === "section-heading") return false;
  if (row.kind === "default-profile") return pendingDefaultProfile;
  return pendingProfileIds.has(row.id);
}

function toggleRow(
  row: GameProfilesSelectionRow,
  pendingDefaultProfile: boolean,
  pendingProfileIds: Set<string>,
): { pendingDefaultProfile: boolean; pendingProfileIds: Set<string> } {
  if (row.kind === "section-heading") {
    return { pendingDefaultProfile, pendingProfileIds };
  }
  if (row.kind === "default-profile") {
    return { pendingDefaultProfile: !pendingDefaultProfile, pendingProfileIds };
  }
  const next = new Set(pendingProfileIds);
  if (next.has(row.id)) {
    next.delete(row.id);
  } else {
    next.add(row.id);
  }
  return { pendingDefaultProfile, pendingProfileIds: next };
}

function deriveBottomBarMessage(
  focusedRow: GameProfilesSelectionRow | undefined,
  defaultProfileId: string | undefined,
  pendingDefaultProfile: boolean,
): string {
  if (!focusedRow) return "";
  if (focusedRow.kind === "default-profile") {
    return "Inherited configuration will change if the default profile changes.";
  }
  if (focusedRow.kind !== "profile") return "";
  if (!pendingDefaultProfile) return "";
  if (focusedRow.id !== defaultProfileId) return "";
  return "Included via default. Select explicitly to inherit regardless of default.";
}

const SAMPLE_PROFILES: Profile[] = [
  { id: "profile-fast-load", name: "Fast Load", isDefault: true },
  { id: "profile-multiplayer", name: "Multiplayer", isDefault: false },
  { id: "profile-sid-8580", name: "SID 8580", isDefault: false },
  { id: "profile-shmups", name: "Shmups", isDefault: false },
];

describe("GameProfilesSelectionScreen", () => {
  describe("buildRows", () => {
    it("places named profiles alphabetically at the top", () => {
      const rows = buildRows(SAMPLE_PROFILES);
      const namedRows = rows.filter((r) => r.kind === "profile");
      const names = namedRows.map((r) => (r.kind === "profile" ? r.name : ""));
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      deep(names, sorted);
    });

    it("includes all profiles (including the default) in named rows", () => {
      const rows = buildRows(SAMPLE_PROFILES);
      const ids = rows
        .filter((r) => r.kind === "profile")
        .map((r) => (r.kind === "profile" ? r.id : ""));
      ok(ids.includes("profile-fast-load"));
    });

    it("places a section-heading between named profiles and the default row", () => {
      const rows = buildRows(SAMPLE_PROFILES);
      const headingIndex = rows.findIndex((r) => r.kind === "section-heading");
      const defIndex = rows.findIndex((r) => r.kind === "default-profile");
      ok(headingIndex >= 0);
      ok(defIndex >= 0);
      eq(defIndex, headingIndex + 1);
    });

    it("places the default row last", () => {
      const rows = buildRows(SAMPLE_PROFILES);
      eq(rows[rows.length - 1].kind, "default-profile");
    });

    it("sets defaultProfileName from the isDefault profile", () => {
      const rows = buildRows(SAMPLE_PROFILES);
      const defRow = rows.find((r) => r.kind === "default-profile");
      ok(defRow && defRow.kind === "default-profile");
      eq(defRow.defaultProfileName, "Fast Load");
    });

    it("omits the section-heading and default row when no default profile exists", () => {
      const noDefault: Profile[] = [
        { id: "profile-multiplayer", name: "Multiplayer", isDefault: false },
      ];
      const rows = buildRows(noDefault);
      eq(rows.length, 1);
      eq(rows[0].kind, "profile");
    });

    it("does not mutate the original profiles array", () => {
      const original = [...SAMPLE_PROFILES];
      buildRows(original);
      eq(original.length, SAMPLE_PROFILES.length);
    });
  });

  describe("isRowChecked", () => {
    it("returns false for section-heading rows", () => {
      const row: GameProfilesSelectionRow = {
        kind: "section-heading",
        label: "heading",
      };
      eq(isRowChecked(row, true, new Set()), false);
    });

    it("returns pendingDefaultProfile for the default-profile row", () => {
      const row: GameProfilesSelectionRow = {
        kind: "default-profile",
        defaultProfileName: "Fast Load",
      };
      eq(isRowChecked(row, true, new Set()), true);
      eq(isRowChecked(row, false, new Set()), false);
    });

    it("returns true for a profile row whose id is in pendingProfileIds", () => {
      const row: GameProfilesSelectionRow = {
        kind: "profile",
        id: "profile-multiplayer",
        name: "Multiplayer",
      };
      eq(isRowChecked(row, false, new Set(["profile-multiplayer"])), true);
    });

    it("returns false for a profile row whose id is not in pendingProfileIds", () => {
      const row: GameProfilesSelectionRow = {
        kind: "profile",
        id: "profile-multiplayer",
        name: "Multiplayer",
      };
      eq(isRowChecked(row, false, new Set()), false);
    });
  });

  describe("toggleRow", () => {
    it("is a no-op for section-heading rows", () => {
      const row: GameProfilesSelectionRow = {
        kind: "section-heading",
        label: "heading",
      };
      const { pendingDefaultProfile, pendingProfileIds } = toggleRow(
        row,
        false,
        new Set(),
      );
      eq(pendingDefaultProfile, false);
      eq(pendingProfileIds.size, 0);
    });

    it("flips pendingDefaultProfile when toggling the default-profile row", () => {
      const row: GameProfilesSelectionRow = {
        kind: "default-profile",
        defaultProfileName: "Fast Load",
      };
      const { pendingDefaultProfile } = toggleRow(row, false, new Set());
      eq(pendingDefaultProfile, true);
    });

    it("adds a profile id when toggling an unchecked profile row", () => {
      const row: GameProfilesSelectionRow = {
        kind: "profile",
        id: "profile-multiplayer",
        name: "Multiplayer",
      };
      const { pendingProfileIds } = toggleRow(row, false, new Set());
      ok(pendingProfileIds.has("profile-multiplayer"));
    });

    it("removes a profile id when toggling a checked profile row", () => {
      const row: GameProfilesSelectionRow = {
        kind: "profile",
        id: "profile-multiplayer",
        name: "Multiplayer",
      };
      const { pendingProfileIds } = toggleRow(
        row,
        false,
        new Set(["profile-multiplayer"]),
      );
      ok(!pendingProfileIds.has("profile-multiplayer"));
    });

    it("does not mutate the original pendingProfileIds set", () => {
      const row: GameProfilesSelectionRow = {
        kind: "profile",
        id: "profile-multiplayer",
        name: "Multiplayer",
      };
      const original = new Set<string>();
      toggleRow(row, false, original);
      ok(!original.has("profile-multiplayer"));
    });

    it("preserves other profile ids when toggling", () => {
      const row: GameProfilesSelectionRow = {
        kind: "profile",
        id: "profile-multiplayer",
        name: "Multiplayer",
      };
      const { pendingProfileIds } = toggleRow(
        row,
        false,
        new Set(["profile-shmups"]),
      );
      ok(pendingProfileIds.has("profile-shmups"));
    });
  });

  describe("deriveBottomBarMessage", () => {
    const defaultProfileId = "profile-fast-load";

    it("returns empty string when focused row is undefined", () => {
      eq(deriveBottomBarMessage(undefined, defaultProfileId, true), "");
    });

    it("returns the default-row tip when focused row is the default-profile row", () => {
      const row: GameProfilesSelectionRow = {
        kind: "default-profile",
        defaultProfileName: "Fast Load",
      };
      eq(
        deriveBottomBarMessage(row, defaultProfileId, true),
        "Inherited configuration will change if the default profile changes.",
      );
    });

    it("returns the default-row tip even when Default row is unchecked", () => {
      const row: GameProfilesSelectionRow = {
        kind: "default-profile",
        defaultProfileName: "Fast Load",
      };
      eq(
        deriveBottomBarMessage(row, defaultProfileId, false),
        "Inherited configuration will change if the default profile changes.",
      );
    });

    it("returns empty string when focused row is a section-heading", () => {
      const row: GameProfilesSelectionRow = {
        kind: "section-heading",
        label: "heading",
      };
      eq(deriveBottomBarMessage(row, defaultProfileId, true), "");
    });

    it("returns empty string when Default row is not checked", () => {
      const row: GameProfilesSelectionRow = {
        kind: "profile",
        id: "profile-fast-load",
        name: "Fast Load",
      };
      eq(deriveBottomBarMessage(row, defaultProfileId, false), "");
    });

    it("returns empty string when focused profile is not the current default", () => {
      const row: GameProfilesSelectionRow = {
        kind: "profile",
        id: "profile-multiplayer",
        name: "Multiplayer",
      };
      eq(deriveBottomBarMessage(row, defaultProfileId, true), "");
    });

    it("returns the implicit-inclusion tip when focused profile is the current default and Default row is checked", () => {
      const row: GameProfilesSelectionRow = {
        kind: "profile",
        id: "profile-fast-load",
        name: "Fast Load",
      };
      eq(
        deriveBottomBarMessage(row, defaultProfileId, true),
        "Included via default. Select explicitly to inherit regardless of default.",
      );
    });

    it("returns empty string when no default profile id is defined", () => {
      const row: GameProfilesSelectionRow = {
        kind: "profile",
        id: "profile-fast-load",
        name: "Fast Load",
      };
      eq(deriveBottomBarMessage(row, undefined, true), "");
    });
  });

  describe("initial pending state", () => {
    it("pre-checks default-profile row when game has inheritDefaultProfile true", () => {
      const row: GameProfilesSelectionRow = {
        kind: "default-profile",
        defaultProfileName: "Fast Load",
      };
      eq(isRowChecked(row, true, new Set()), true);
    });

    it("pre-checks profile rows matching existing game profile refs", () => {
      const existingIds = new Set(["profile-multiplayer", "profile-shmups"]);
      const row: GameProfilesSelectionRow = {
        kind: "profile",
        id: "profile-multiplayer",
        name: "Multiplayer",
      };
      eq(isRowChecked(row, false, existingIds), true);
    });

    it("does not pre-check profile rows not in game profile refs", () => {
      const existingIds = new Set(["profile-multiplayer"]);
      const row: GameProfilesSelectionRow = {
        kind: "profile",
        id: "profile-sid-8580",
        name: "SID 8580",
      };
      eq(isRowChecked(row, false, existingIds), false);
    });
  });
});
