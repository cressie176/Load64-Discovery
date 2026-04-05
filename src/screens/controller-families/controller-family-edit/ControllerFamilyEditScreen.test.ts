import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_CONTROLLER_FAMILIES } from "../controller-family-selection/seed.ts";

function validateFamilyName(
	name: string,
	existingNames: string[],
	currentName: string | undefined,
): string {
	const trimmed = name.trim();
	if (!trimmed) return "Family name is required.";
	if (trimmed !== currentName && existingNames.includes(trimmed)) {
		return `A family named "${trimmed}" already exists.`;
	}
	return "";
}

function generateFamilyId(name: string): string {
	return `family-${name.trim().toLowerCase().replace(/\s+/g, "-")}`;
}

describe("ControllerFamilyEditScreen", () => {
	describe("validateFamilyName", () => {
		const existingNames = SEED_CONTROLLER_FAMILIES.families.map((f) => f.name);

		it("returns error when name is empty", () => {
			eq(
				validateFamilyName("", existingNames, undefined),
				"Family name is required.",
			);
		});

		it("returns error when name is only whitespace", () => {
			eq(
				validateFamilyName("   ", existingNames, undefined),
				"Family name is required.",
			);
		});

		it("returns error when name duplicates an existing family", () => {
			eq(
				validateFamilyName("Logitech", existingNames, undefined),
				'A family named "Logitech" already exists.',
			);
		});

		it("returns no error when name is unique", () => {
			eq(validateFamilyName("New Family", existingNames, undefined), "");
		});

		it("returns no error when renaming to the same name as current", () => {
			eq(validateFamilyName("Logitech", existingNames, "Logitech"), "");
		});

		it("returns error when renaming to a different existing name", () => {
			eq(
				validateFamilyName("Microsoft Xbox", existingNames, "Logitech"),
				'A family named "Microsoft Xbox" already exists.',
			);
		});

		it("trims whitespace before validation", () => {
			eq(validateFamilyName("  New Family  ", existingNames, undefined), "");
		});
	});

	describe("generateFamilyId", () => {
		it("generates id from a simple name", () => {
			eq(generateFamilyId("Logitech"), "family-logitech");
		});

		it("converts spaces to hyphens", () => {
			eq(generateFamilyId("Microsoft Xbox"), "family-microsoft-xbox");
		});

		it("lowercases the name", () => {
			eq(generateFamilyId("Sony DualShock"), "family-sony-dualshock");
		});

		it("trims leading and trailing whitespace", () => {
			eq(generateFamilyId("  Logitech  "), "family-logitech");
		});

		it("collapses multiple spaces", () => {
			eq(generateFamilyId("A  B"), "family-a-b");
		});
	});
});
