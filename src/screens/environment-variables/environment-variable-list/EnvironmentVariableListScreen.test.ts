import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_ENV_VARS } from "./seed.ts";
import type { EnvVarRow, EnvVarsState } from "./types.ts";

function ownerTypeLabel(type: string): string {
  switch (type) {
    case "family":
      return "Family";
    case "controller":
      return "Controller";
    case "profile":
      return "Profile";
    case "launch-config":
      return "Launch Config";
    default:
      return type;
  }
}

function buildRows(ownerId: string, state: EnvVarsState): EnvVarRow[] {
  const owner = state.owners.find((o) => o.id === ownerId);
  if (!owner) return [];

  const ownedVars = state.variables.filter((v) => v.ownerId === ownerId);

  const inheritedRows: EnvVarRow[] = owner.parentIds.flatMap((parentId) => {
    const parent = state.owners.find((o) => o.id === parentId);
    const parentLabel = parent
      ? `${ownerTypeLabel(parent.type)}: ${parent.name}`
      : parentId;
    return state.variables
      .filter((v) => v.ownerId === parentId)
      .map((v) => ({
        id: v.id,
        name: v.name,
        value: v.value || "—",
        sourceLabel: parentLabel,
        isInherited: true,
        ownerId: v.ownerId,
      }));
  });

  const ownedRows: EnvVarRow[] = ownedVars.map((v) => ({
    id: v.id,
    name: v.name,
    value: v.value || "—",
    sourceLabel: "—",
    isInherited: false,
    ownerId: v.ownerId,
  }));

  const allRows = [...ownedRows, ...inheritedRows].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const ownedNames = new Set(ownedRows.map((r) => r.name));
  return allRows.filter((r) => !r.isInherited || !ownedNames.has(r.name));
}

describe("EnvironmentVariableListScreen", () => {
  describe("SEED_ENV_VARS", () => {
    it("has owners", () => {
      ok(SEED_ENV_VARS.owners.length > 0);
    });

    it("has variables", () => {
      ok(SEED_ENV_VARS.variables.length > 0);
    });

    it("all variables reference a valid owner", () => {
      const ownerIds = new Set(SEED_ENV_VARS.owners.map((o) => o.id));
      for (const v of SEED_ENV_VARS.variables) {
        ok(
          ownerIds.has(v.ownerId),
          `Variable ${v.id} references unknown owner ${v.ownerId}`,
        );
      }
    });

    it("all parent references in owners are valid owner ids", () => {
      const ownerIds = new Set(SEED_ENV_VARS.owners.map((o) => o.id));
      for (const owner of SEED_ENV_VARS.owners) {
        for (const parentId of owner.parentIds) {
          ok(
            ownerIds.has(parentId),
            `Owner ${owner.id} references unknown parent ${parentId}`,
          );
        }
      }
    });

    it("each variable has required string fields", () => {
      for (const v of SEED_ENV_VARS.variables) {
        eq(typeof v.id, "string");
        eq(typeof v.ownerId, "string");
        eq(typeof v.name, "string");
        eq(typeof v.value, "string");
      }
    });
  });

  describe("buildRows for an owner with no parents", () => {
    it("returns only owned rows", () => {
      const rows = buildRows("family-logitech", SEED_ENV_VARS);
      ok(rows.every((r) => !r.isInherited));
    });

    it("rows are sorted alphabetically by name", () => {
      const rows = buildRows("family-logitech", SEED_ENV_VARS);
      const names = rows.map((r) => r.name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      deep(names, sorted);
    });

    it("owned rows have sourceLabel —", () => {
      const rows = buildRows("family-logitech", SEED_ENV_VARS);
      ok(rows.every((r) => r.sourceLabel === "—"));
    });
  });

  describe("buildRows for a controller owner with a family parent", () => {
    it("includes owned rows and inherited rows from the family", () => {
      const rows = buildRows("controller-logitech-dual-action", SEED_ENV_VARS);
      const ownedRows = rows.filter((r) => !r.isInherited);
      const inheritedRows = rows.filter((r) => r.isInherited);
      ok(ownedRows.length > 0);
      ok(inheritedRows.length > 0);
    });

    it("labels inherited rows with the family name", () => {
      const rows = buildRows("controller-logitech-dual-action", SEED_ENV_VARS);
      const inherited = rows.filter((r) => r.isInherited);
      ok(inherited.every((r) => r.sourceLabel === "Family: Logitech"));
    });

    it("owned rows take precedence over inherited rows with the same name", () => {
      const state: EnvVarsState = {
        owners: [
          {
            id: "family-test",
            name: "Test Family",
            type: "family",
            parentIds: [],
          },
          {
            id: "ctrl-test",
            name: "Test Controller",
            type: "controller",
            parentIds: ["family-test"],
          },
        ],
        variables: [
          { id: "v1", ownerId: "family-test", name: "MY_VAR", value: "family" },
          { id: "v2", ownerId: "ctrl-test", name: "MY_VAR", value: "override" },
        ],
      };
      const rows = buildRows("ctrl-test", state);
      const myVarRows = rows.filter((r) => r.name === "MY_VAR");
      eq(myVarRows.length, 1);
      eq(myVarRows[0]?.isInherited, false);
      eq(myVarRows[0]?.value, "override");
    });

    it("rows are sorted alphabetically by name", () => {
      const rows = buildRows("controller-logitech-dual-action", SEED_ENV_VARS);
      const names = rows.map((r) => r.name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      deep(names, sorted);
    });
  });

  describe("buildRows for a launch-config owner with profiles", () => {
    it("includes owned rows and inherited rows from all profiles", () => {
      const rows = buildRows("launch-config-monty", SEED_ENV_VARS);
      const ownedRows = rows.filter((r) => !r.isInherited);
      const inheritedRows = rows.filter((r) => r.isInherited);
      ok(ownedRows.length > 0);
      ok(inheritedRows.length > 0);
    });

    it("labels inherited rows with the profile name", () => {
      const rows = buildRows("launch-config-monty", SEED_ENV_VARS);
      const inherited = rows.filter((r) => r.isInherited);
      ok(inherited.every((r) => r.sourceLabel.startsWith("Profile:")));
    });

    it("rows are sorted alphabetically by name", () => {
      const rows = buildRows("launch-config-monty", SEED_ENV_VARS);
      const names = rows.map((r) => r.name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      deep(names, sorted);
    });
  });

  describe("buildRows for unknown owner", () => {
    it("returns empty array", () => {
      const rows = buildRows("unknown-owner", SEED_ENV_VARS);
      deep(rows, []);
    });
  });

  describe("EnvVarRow value display", () => {
    it("empty value is shown as —", () => {
      const state: EnvVarsState = {
        owners: [
          { id: "owner-1", name: "Owner", type: "profile", parentIds: [] },
        ],
        variables: [
          { id: "v1", ownerId: "owner-1", name: "MY_VAR", value: "" },
        ],
      };
      const rows = buildRows("owner-1", state);
      eq(rows[0]?.value, "—");
    });

    it("non-empty value is shown as-is", () => {
      const state: EnvVarsState = {
        owners: [
          { id: "owner-1", name: "Owner", type: "profile", parentIds: [] },
        ],
        variables: [
          { id: "v1", ownerId: "owner-1", name: "MY_VAR", value: "hello" },
        ],
      };
      const rows = buildRows("owner-1", state);
      eq(rows[0]?.value, "hello");
    });
  });
});
