import { deepStrictEqual as deep, equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_GENERAL_SETTINGS } from "./seed.ts";
import type { GeneralSettings } from "./types.ts";

function deriveBottomBarMessage(
	settings: GeneralSettings,
	errorMessage: string,
	hasSavedDirectory: boolean,
): string {
	if (errorMessage) return errorMessage;
	if (!hasSavedDirectory) return "A games directory is required to continue.";
	if (!settings.catalogueUrl)
		return "Catalogue features are disabled. Enter a Catalogue URL to enable them.";
	return "";
}

function isValidUrl(value: string): boolean {
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
}

describe("GeneralSettingsScreen", () => {
	describe("SEED_GENERAL_SETTINGS", () => {
		it("has a games directory", () => {
			eq(typeof SEED_GENERAL_SETTINGS.gamesDirectory, "string");
			eq(SEED_GENERAL_SETTINGS.gamesDirectory.length > 0, true);
		});

		it("has a catalogue URL", () => {
			eq(typeof SEED_GENERAL_SETTINGS.catalogueUrl, "string");
			eq(isValidUrl(SEED_GENERAL_SETTINGS.catalogueUrl), true);
		});

		it("has showSplashscreen set to true by default", () => {
			eq(SEED_GENERAL_SETTINGS.showSplashscreen, true);
		});
	});

	describe("deriveBottomBarMessage", () => {
		it("returns error message when one is set", () => {
			const settings: GeneralSettings = {
				gamesDirectory: "/games",
				catalogueUrl: "",
				showSplashscreen: true,
			};
			eq(
				deriveBottomBarMessage(settings, "Games directory is required.", true),
				"Games directory is required.",
			);
		});

		it("returns required-directory message when no saved directory", () => {
			const settings: GeneralSettings = {
				gamesDirectory: "",
				catalogueUrl: "",
				showSplashscreen: true,
			};
			eq(
				deriveBottomBarMessage(settings, "", false),
				"A games directory is required to continue.",
			);
		});

		it("returns catalogue-disabled message when directory set but no catalogue URL", () => {
			const settings: GeneralSettings = {
				gamesDirectory: "/games",
				catalogueUrl: "",
				showSplashscreen: true,
			};
			eq(
				deriveBottomBarMessage(settings, "", true),
				"Catalogue features are disabled. Enter a Catalogue URL to enable them.",
			);
		});

		it("returns empty string when fully configured", () => {
			const settings: GeneralSettings = {
				gamesDirectory: "/games",
				catalogueUrl: "https://example.com/catalogue.zip",
				showSplashscreen: true,
			};
			eq(deriveBottomBarMessage(settings, "", true), "");
		});

		it("error message takes priority over missing directory", () => {
			const settings: GeneralSettings = {
				gamesDirectory: "",
				catalogueUrl: "",
				showSplashscreen: true,
			};
			eq(deriveBottomBarMessage(settings, "Some error", false), "Some error");
		});
	});

	describe("isValidUrl", () => {
		it("returns true for a valid HTTPS URL", () => {
			eq(isValidUrl("https://example.com/catalogue.zip"), true);
		});

		it("returns true for a valid HTTP URL", () => {
			eq(isValidUrl("http://example.com/catalogue.zip"), true);
		});

		it("returns false for an empty string", () => {
			eq(isValidUrl(""), false);
		});

		it("returns false for a plain string with no protocol", () => {
			eq(isValidUrl("not-a-url"), false);
		});

		it("returns false for a path without protocol", () => {
			eq(isValidUrl("/some/path"), false);
		});
	});

	describe("GeneralSettings type", () => {
		it("accepts a complete settings object", () => {
			const settings: GeneralSettings = {
				gamesDirectory: "/Users/steve/Games/C64",
				catalogueUrl: "https://example.com/catalogue.zip",
				showSplashscreen: false,
			};
			deep(settings, {
				gamesDirectory: "/Users/steve/Games/C64",
				catalogueUrl: "https://example.com/catalogue.zip",
				showSplashscreen: false,
			});
		});
	});
});
