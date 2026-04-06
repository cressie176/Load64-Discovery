import { deepStrictEqual as deep, equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_CONTROLLER_FAMILIES } from "../controller-family-selection/seed.ts";
import type {
  ControllerFamiliesState,
  ControllerFamily,
} from "../controller-family-selection/types.ts";

function buildFamilyOptions(
  families: ControllerFamily[],
): Array<{ id: string; label: string }> {
  const sorted = [...families].sort((a, b) => a.name.localeCompare(b.name));
  return [
    ...sorted.map((f) => ({ id: f.id, label: f.name })),
    { id: "", label: "None" },
  ];
}

function resolveInitialValue(currentFamilyId: string | null): string {
  return currentFamilyId ?? "";
}

function assignFamily(
  state: ControllerFamiliesState,
  controllerId: string,
  familyId: string | null,
): ControllerFamiliesState {
  return {
    ...state,
    controllers: state.controllers.map((c) =>
      c.id === controllerId ? { ...c, familyId } : c,
    ),
  };
}

describe("ControllerFamilyAssignmentScreen", () => {
  describe("buildFamilyOptions", () => {
    it("sorts families alphabetically with None last", () => {
      const families: ControllerFamily[] = [
        { id: "f3", name: "Sony DualShock" },
        { id: "f1", name: "Logitech" },
        { id: "f2", name: "Microsoft Xbox" },
      ];
      const options = buildFamilyOptions(families);
      deep(
        options.map((o) => o.label),
        ["Logitech", "Microsoft Xbox", "Sony DualShock", "None"],
      );
    });

    it("None option has empty string id", () => {
      const options = buildFamilyOptions(SEED_CONTROLLER_FAMILIES.families);
      const noneOption = options[options.length - 1];
      eq(noneOption?.id, "");
      eq(noneOption?.label, "None");
    });

    it("does not mutate the original array", () => {
      const families = [...SEED_CONTROLLER_FAMILIES.families];
      const original = families.map((f) => f.id);
      buildFamilyOptions(families);
      deep(
        families.map((f) => f.id),
        original,
      );
    });
  });

  describe("resolveInitialValue", () => {
    it("returns the family id when one is assigned", () => {
      eq(resolveInitialValue("family-logitech"), "family-logitech");
    });

    it("returns empty string when no family is assigned", () => {
      eq(resolveInitialValue(null), "");
    });
  });

  describe("assignFamily", () => {
    it("assigns a family to a controller", () => {
      const result = assignFamily(
        SEED_CONTROLLER_FAMILIES,
        "controller-dualshock-4",
        "family-dualshock",
      );
      const updated = result.controllers.find(
        (c) => c.id === "controller-dualshock-4",
      );
      eq(updated?.familyId, "family-dualshock");
    });

    it("removes a family assignment when given null", () => {
      const result = assignFamily(
        SEED_CONTROLLER_FAMILIES,
        "controller-logitech-f310",
        null,
      );
      const updated = result.controllers.find(
        (c) => c.id === "controller-logitech-f310",
      );
      eq(updated?.familyId, null);
    });

    it("does not modify other controllers", () => {
      const result = assignFamily(
        SEED_CONTROLLER_FAMILIES,
        "controller-dualshock-4",
        "family-dualshock",
      );
      const xbox = result.controllers.find(
        (c) => c.id === "controller-xbox-360",
      );
      eq(xbox?.familyId, "family-xbox");
    });

    it("preserves all controllers", () => {
      const result = assignFamily(
        SEED_CONTROLLER_FAMILIES,
        "controller-dualshock-4",
        "family-dualshock",
      );
      eq(
        result.controllers.length,
        SEED_CONTROLLER_FAMILIES.controllers.length,
      );
    });
  });

  describe("SEED_CONTROLLER_FAMILIES", () => {
    it("has families", () => {
      ok(SEED_CONTROLLER_FAMILIES.families.length > 0);
    });

    it("has controllers", () => {
      ok(SEED_CONTROLLER_FAMILIES.controllers.length > 0);
    });

    it("each family has an id and name", () => {
      for (const family of SEED_CONTROLLER_FAMILIES.families) {
        eq(typeof family.id, "string");
        eq(typeof family.name, "string");
      }
    });
  });
});
