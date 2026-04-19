import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_PROFILES } from "../profile-list/seed.ts";

function validateProfileName(
  name: string,
  existingNames: string[],
  currentName: string | undefined,
): string {
  const trimmed = name.trim();
  if (!trimmed) return "Profile name is required.";
  if (trimmed !== currentName && existingNames.includes(trimmed)) {
    return `A profile named "${trimmed}" already exists.`;
  }
  return "";
}

function generateProfileId(name: string): string {
  return `profile-${name.trim().toLowerCase().replace(/\s+/g, "-")}`;
}

describe("ProfileEditScreen", () => {
  describe("validateProfileName", () => {
    const existingNames = SEED_PROFILES.profiles.map((p) => p.name);

    it("returns error when name is empty", () => {
      eq(
        validateProfileName("", existingNames, undefined),
        "Profile name is required.",
      );
    });

    it("returns error when name is only whitespace", () => {
      eq(
        validateProfileName("   ", existingNames, undefined),
        "Profile name is required.",
      );
    });

    it("returns error when name duplicates an existing profile", () => {
      eq(
        validateProfileName("Fast Load", existingNames, undefined),
        'A profile named "Fast Load" already exists.',
      );
    });

    it("returns no error when name is unique", () => {
      eq(validateProfileName("New Profile", existingNames, undefined), "");
    });

    it("returns no error when renaming to the same name as current", () => {
      eq(validateProfileName("Fast Load", existingNames, "Fast Load"), "");
    });

    it("returns error when renaming to a different existing name", () => {
      eq(
        validateProfileName("Multiplayer", existingNames, "Fast Load"),
        'A profile named "Multiplayer" already exists.',
      );
    });

    it("trims whitespace before validation", () => {
      eq(validateProfileName("  New Profile  ", existingNames, undefined), "");
    });
  });

  describe("generateProfileId", () => {
    it("generates id from a simple name", () => {
      eq(generateProfileId("Default"), "profile-default");
    });

    it("converts spaces to hyphens", () => {
      eq(generateProfileId("New Profile"), "profile-new-profile");
    });

    it("lowercases the name", () => {
      eq(generateProfileId("SID 8580"), "profile-sid-8580");
    });

    it("trims leading and trailing whitespace", () => {
      eq(generateProfileId("  Test  "), "profile-test");
    });

    it("collapses multiple spaces", () => {
      eq(generateProfileId("A  B"), "profile-a-b");
    });
  });
});
