import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_CONTROLS } from "./seed.ts";
import {
  CANONICAL_CONTROL_LABELS,
  CANONICAL_CONTROL_ORDER,
  type CanonicalControlName,
  type ControlRow,
  type ControlsState,
} from "./types.ts";

function buildRows(ownerId: string, state: ControlsState): ControlRow[] {
  const owner = state.owners.find((o) => o.id === ownerId);
  if (!owner) return [];

  const ownedControls = state.controls.filter((c) => c.ownerId === ownerId);
  const familyControls =
    owner.familyId != null
      ? state.controls.filter((c) => c.ownerId === owner.familyId)
      : [];

  return CANONICAL_CONTROL_ORDER.map((canonicalName) => {
    const owned = ownedControls.find((c) => c.canonicalName === canonicalName);
    const inherited = familyControls.find(
      (c) => c.canonicalName === canonicalName,
    );

    if (owner.type === "family") {
      return buildFamilyRow(canonicalName, owned ?? null);
    }
    return buildControllerRow(
      canonicalName,
      owned ?? null,
      inherited ?? null,
      owner.familyName,
    );
  });
}

function buildFamilyRow(
  canonicalName: CanonicalControlName,
  owned: { id: string; controlName: string; event: string } | null,
): ControlRow {
  return {
    canonicalName,
    canonicalLabel: CANONICAL_CONTROL_LABELS[canonicalName],
    controlName: owned?.controlName ?? "—",
    event: owned?.event ?? "—",
    sourceLabel: null,
    isInherited: false,
    hasFamilyFallback: false,
    entryId: owned?.id ?? null,
  };
}

function buildControllerRow(
  canonicalName: CanonicalControlName,
  owned: { id: string; controlName: string; event: string } | null,
  inherited: { id: string; controlName: string; event: string } | null,
  familyName: string | undefined,
): ControlRow {
  if (owned) {
    return {
      canonicalName,
      canonicalLabel: CANONICAL_CONTROL_LABELS[canonicalName],
      controlName: owned.controlName,
      event: owned.event,
      sourceLabel: "—",
      isInherited: false,
      hasFamilyFallback: false,
      entryId: owned.id,
    };
  }
  if (inherited) {
    return {
      canonicalName,
      canonicalLabel: CANONICAL_CONTROL_LABELS[canonicalName],
      controlName: inherited.controlName,
      event: inherited.event,
      sourceLabel: familyName ?? "Family",
      isInherited: true,
      hasFamilyFallback: false,
      entryId: inherited.id,
    };
  }
  return {
    canonicalName,
    canonicalLabel: CANONICAL_CONTROL_LABELS[canonicalName],
    controlName: "—",
    event: "—",
    sourceLabel: "—",
    isInherited: false,
    hasFamilyFallback: false,
    entryId: null,
  };
}

describe("ControlListScreen", () => {
  describe("SEED_CONTROLS", () => {
    it("has owners", () => {
      ok(SEED_CONTROLS.owners.length > 0);
    });

    it("has controls", () => {
      ok(SEED_CONTROLS.controls.length > 0);
    });

    it("all controls reference a valid owner", () => {
      const ownerIds = new Set(SEED_CONTROLS.owners.map((o) => o.id));
      for (const ctrl of SEED_CONTROLS.controls) {
        ok(
          ownerIds.has(ctrl.ownerId),
          `Control ${ctrl.id} references unknown owner ${ctrl.ownerId}`,
        );
      }
    });

    it("all family references in controller owners are valid owner ids", () => {
      const ownerIds = new Set(SEED_CONTROLS.owners.map((o) => o.id));
      for (const owner of SEED_CONTROLS.owners) {
        if (owner.familyId != null) {
          ok(
            ownerIds.has(owner.familyId),
            `Owner ${owner.id} references unknown family ${owner.familyId}`,
          );
        }
      }
    });

    it("each control has required string fields", () => {
      for (const ctrl of SEED_CONTROLS.controls) {
        eq(typeof ctrl.id, "string");
        eq(typeof ctrl.ownerId, "string");
        eq(typeof ctrl.controlName, "string");
        eq(typeof ctrl.canonicalName, "string");
        eq(typeof ctrl.event, "string");
      }
    });
  });

  describe("CANONICAL_CONTROL_ORDER", () => {
    it("contains all canonical control names", () => {
      const keys = Object.keys(CANONICAL_CONTROL_LABELS);
      eq(CANONICAL_CONTROL_ORDER.length, keys.length);
      for (const name of CANONICAL_CONTROL_ORDER) {
        ok(keys.includes(name), `${name} not in CANONICAL_CONTROL_LABELS`);
      }
    });

    it("starts with button_south", () => {
      eq(CANONICAL_CONTROL_ORDER[0], "button_south");
    });
  });

  describe("buildRows for a family owner", () => {
    it("returns one row per canonical control", () => {
      const rows = buildRows("family-logitech", SEED_CONTROLS);
      eq(rows.length, CANONICAL_CONTROL_ORDER.length);
    });

    it("has no inherited rows", () => {
      const rows = buildRows("family-logitech", SEED_CONTROLS);
      ok(rows.every((r) => !r.isInherited));
    });

    it("has null sourceLabel for all rows", () => {
      const rows = buildRows("family-logitech", SEED_CONTROLS);
      ok(rows.every((r) => r.sourceLabel === null));
    });

    it("shows — for unmapped control name and event", () => {
      const rows = buildRows("family-logitech", SEED_CONTROLS);
      const dpadUpRow = rows.find((r) => r.canonicalName === "dpad_up");
      eq(dpadUpRow?.controlName, "—");
      eq(dpadUpRow?.event, "—");
    });

    it("shows mapped values for defined controls", () => {
      const rows = buildRows("family-logitech", SEED_CONTROLS);
      const buttonSouthRow = rows.find(
        (r) => r.canonicalName === "button_south",
      );
      eq(buttonSouthRow?.controlName, "A");
      eq(buttonSouthRow?.event, "button_1");
    });

    it("rows follow CANONICAL_CONTROL_ORDER", () => {
      const rows = buildRows("family-logitech", SEED_CONTROLS);
      const rowOrder = rows.map((r) => r.canonicalName);
      deep(rowOrder, CANONICAL_CONTROL_ORDER);
    });
  });

  describe("buildRows for a controller owner with family", () => {
    it("returns one row per canonical control", () => {
      const rows = buildRows("controller-logitech-dual-action", SEED_CONTROLS);
      eq(rows.length, CANONICAL_CONTROL_ORDER.length);
    });

    it("marks controller-owned rows as not inherited with sourceLabel —", () => {
      const rows = buildRows("controller-logitech-dual-action", SEED_CONTROLS);
      const owned = rows.filter((r) => !r.isInherited);
      ok(owned.length > 0);
      ok(owned.every((r) => r.sourceLabel === "—"));
    });

    it("marks family-inherited rows as inherited with family name as sourceLabel", () => {
      const rows = buildRows("controller-logitech-dual-action", SEED_CONTROLS);
      const inherited = rows.filter((r) => r.isInherited);
      ok(inherited.length > 0);
      ok(inherited.every((r) => r.sourceLabel === "Logitech"));
    });

    it("controller-owned rows take precedence over inherited rows", () => {
      const rows = buildRows("controller-logitech-dual-action", SEED_CONTROLS);
      const buttonSouthRow = rows.find(
        (r) => r.canonicalName === "button_south",
      );
      eq(buttonSouthRow?.isInherited, false);
      eq(buttonSouthRow?.sourceLabel, "—");
    });
  });

  describe("buildRows for a controller owner with no family", () => {
    it("returns one row per canonical control", () => {
      const rows = buildRows("controller-dualsense", SEED_CONTROLS);
      eq(rows.length, CANONICAL_CONTROL_ORDER.length);
    });

    it("all rows show — for control name and event when no controls defined", () => {
      const rows = buildRows("controller-dualsense", SEED_CONTROLS);
      ok(rows.every((r) => r.controlName === "—"));
      ok(rows.every((r) => r.event === "—"));
    });

    it("all rows show sourceLabel — when no family", () => {
      const rows = buildRows("controller-dualsense", SEED_CONTROLS);
      ok(rows.every((r) => r.sourceLabel === "—"));
    });

    it("no rows are inherited when no family assigned", () => {
      const rows = buildRows("controller-dualsense", SEED_CONTROLS);
      ok(rows.every((r) => !r.isInherited));
    });
  });

  describe("buildRows for unknown owner", () => {
    it("returns empty array", () => {
      const rows = buildRows("unknown-owner", SEED_CONTROLS);
      deep(rows, []);
    });
  });

  describe("CANONICAL_CONTROL_LABELS", () => {
    it("has human-readable label for button_south", () => {
      eq(CANONICAL_CONTROL_LABELS.button_south, "Button South");
    });

    it("has human-readable label for dpad_up", () => {
      eq(CANONICAL_CONTROL_LABELS.dpad_up, "D-Pad Up");
    });
  });
});
