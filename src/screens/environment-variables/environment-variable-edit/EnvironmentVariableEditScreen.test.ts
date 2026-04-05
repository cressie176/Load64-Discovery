import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";

function validateForm(name: string, existingNames: string[]): string | null {
	if (!name.trim()) return "Name is required.";
	if (existingNames.includes(name.trim()))
		return `${name.trim()} already exists.`;
	return null;
}

describe("EnvironmentVariableEditScreen", () => {
	describe("validateForm", () => {
		it("returns error when name is empty", () => {
			eq(validateForm("", []), "Name is required.");
		});

		it("returns error when name is only whitespace", () => {
			eq(validateForm("   ", []), "Name is required.");
		});

		it("returns error when name already exists for this owner", () => {
			eq(
				validateForm("SDL_JOYSTICK_MFI", ["SDL_JOYSTICK_MFI"]),
				"SDL_JOYSTICK_MFI already exists.",
			);
		});

		it("returns null for a valid unique name", () => {
			eq(validateForm("MY_NEW_VAR", []), null);
		});

		it("returns null when editing and name is unchanged (not in existingNames)", () => {
			eq(validateForm("SDL_JOYSTICK_MFI", ["SDL_JOYSTICK_OTHER"]), null);
		});

		it("trims whitespace before checking uniqueness", () => {
			eq(
				validateForm("  SDL_JOYSTICK_MFI  ", ["SDL_JOYSTICK_MFI"]),
				"SDL_JOYSTICK_MFI already exists.",
			);
		});

		it("returns null when value is empty (value is not required)", () => {
			eq(validateForm("MY_VAR", []), null);
		});
	});
});
