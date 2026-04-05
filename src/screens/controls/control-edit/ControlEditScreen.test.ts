import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import type { CanonicalControlName } from "../control-list/types.ts";

interface ControlEntry {
  id: string;
  ownerId: string;
  controlName: string;
  canonicalName: CanonicalControlName;
  event: string;
}

function validateControlName(
  controlName: string,
  ownerId: string,
  existingEntryId: string | null,
  controls: ControlEntry[],
): string | null {
  if (!controlName.trim()) return "Control Name is required.";
  const duplicate = controls.find(
    (c) =>
      c.ownerId === ownerId &&
      c.controlName === controlName.trim() &&
      c.id !== existingEntryId,
  );
  if (duplicate) return "Control Name must be unique within this owner.";
  return null;
}

function validateEvent(
  event: string,
  canonicalName: CanonicalControlName,
  ownerId: string,
  existingEntryId: string | null,
  controls: ControlEntry[],
): string | null {
  if (!event.trim()) return "Event is required.";
  const conflict = controls.find(
    (c) =>
      c.ownerId === ownerId &&
      c.event === event.trim() &&
      c.canonicalName !== canonicalName &&
      c.id !== existingEntryId,
  );
  if (conflict)
    return "Event must map to at most one canonical name within this owner.";
  return null;
}

const SAMPLE_CONTROLS: ControlEntry[] = [
  {
    id: "ctrl-1",
    ownerId: "family-logitech",
    controlName: "A",
    canonicalName: "button_south",
    event: "button_1",
  },
  {
    id: "ctrl-2",
    ownerId: "family-logitech",
    controlName: "B",
    canonicalName: "button_east",
    event: "button_0",
  },
];

describe("ControlEditScreen", () => {
  describe("validateControlName", () => {
    it("returns error when control name is empty", () => {
      eq(
        validateControlName("", "family-logitech", null, SAMPLE_CONTROLS),
        "Control Name is required.",
      );
    });

    it("returns error when control name is whitespace only", () => {
      eq(
        validateControlName("   ", "family-logitech", null, SAMPLE_CONTROLS),
        "Control Name is required.",
      );
    });

    it("returns error when control name duplicates an existing entry in the same owner", () => {
      eq(
        validateControlName("A", "family-logitech", null, SAMPLE_CONTROLS),
        "Control Name must be unique within this owner.",
      );
    });

    it("returns null when control name is unique within owner", () => {
      eq(
        validateControlName("X", "family-logitech", null, SAMPLE_CONTROLS),
        null,
      );
    });

    it("allows the same name when editing the same entry", () => {
      eq(
        validateControlName("A", "family-logitech", "ctrl-1", SAMPLE_CONTROLS),
        null,
      );
    });

    it("allows duplicate name in a different owner", () => {
      eq(validateControlName("A", "family-other", null, SAMPLE_CONTROLS), null);
    });
  });

  describe("validateEvent", () => {
    it("returns error when event is empty", () => {
      eq(
        validateEvent(
          "",
          "button_south",
          "family-logitech",
          null,
          SAMPLE_CONTROLS,
        ),
        "Event is required.",
      );
    });

    it("returns error when event is whitespace only", () => {
      eq(
        validateEvent(
          "   ",
          "button_south",
          "family-logitech",
          null,
          SAMPLE_CONTROLS,
        ),
        "Event is required.",
      );
    });

    it("returns error when event already maps to a different canonical name in the same owner", () => {
      eq(
        validateEvent(
          "button_1",
          "button_east",
          "family-logitech",
          null,
          SAMPLE_CONTROLS,
        ),
        "Event must map to at most one canonical name within this owner.",
      );
    });

    it("returns null when event is unique within owner", () => {
      eq(
        validateEvent(
          "button_99",
          "button_south",
          "family-logitech",
          null,
          SAMPLE_CONTROLS,
        ),
        null,
      );
    });

    it("allows the same event when editing the same entry", () => {
      eq(
        validateEvent(
          "button_1",
          "button_south",
          "family-logitech",
          "ctrl-1",
          SAMPLE_CONTROLS,
        ),
        null,
      );
    });

    it("allows duplicate event in a different owner", () => {
      eq(
        validateEvent(
          "button_1",
          "button_south",
          "family-other",
          null,
          SAMPLE_CONTROLS,
        ),
        null,
      );
    });
  });
});
