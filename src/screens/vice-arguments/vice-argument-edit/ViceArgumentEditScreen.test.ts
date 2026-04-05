import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";

function validateName(name: string): string | null {
  if (!name.trim()) return "Name is required.";
  if (!/^[-+]/.test(name)) return "Name must begin with - or +.";
  if (/\s/.test(name)) return "Name must not contain spaces.";
  return null;
}

describe("ViceArgumentEditScreen", () => {
  describe("validateName", () => {
    it("returns error when name is empty", () => {
      eq(validateName(""), "Name is required.");
    });

    it("returns error when name is only whitespace", () => {
      eq(validateName("   "), "Name is required.");
    });

    it("returns error when name does not begin with - or +", () => {
      eq(validateName("sidmodel"), "Name must begin with - or +.");
    });

    it("returns error when name contains spaces", () => {
      eq(validateName("-sid model"), "Name must not contain spaces.");
    });

    it("returns null for a valid argument starting with -", () => {
      eq(validateName("-sidmodel"), null);
    });

    it("returns null for a valid argument starting with +", () => {
      eq(validateName("+confirmonexit"), null);
    });

    it("returns null for a valid argument with a hyphenated name", () => {
      eq(validateName("-autostart-warp"), null);
    });

    it("returns null for a valid argument with numbers", () => {
      eq(validateName("-drive8type"), null);
    });
  });
});
