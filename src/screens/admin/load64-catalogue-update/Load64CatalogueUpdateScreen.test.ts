import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_CATALOGUE_STATE } from "./seed.ts";

function formatTimestamp(isoString: string): string {
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const date = new Date(isoString);
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} at ${hours}:${minutes}`;
}

function bumpVersion(version: string): string {
  const parts = version.split(".");
  if (parts.length < 3) return version;
  const major = Number(parts[0]);
  const minor = Number(parts[1]) + 1;
  return `${major}.${minor}.0`;
}

function deriveBottomBarMessage(
  hasCatalogueUrl: boolean,
  isUpdating: boolean,
  statusMessage: string,
): string {
  if (!hasCatalogueUrl) {
    return "Catalogue features are disabled. Enter a Catalogue URL to enable them.";
  }
  if (isUpdating) return "Updating catalogue\u2026";
  return statusMessage;
}

describe("Load64CatalogueUpdateScreen", () => {
  describe("SEED_CATALOGUE_STATE", () => {
    it("has a version string", () => {
      eq(typeof SEED_CATALOGUE_STATE.version, "string");
    });

    it("has a lastUpdated ISO timestamp", () => {
      const { lastUpdated } = SEED_CATALOGUE_STATE;
      eq(typeof lastUpdated, "string");
      eq(Number.isNaN(new Date(lastUpdated as string).getTime()), false);
    });
  });

  describe("formatTimestamp", () => {
    it("formats a UTC timestamp in local date/time style", () => {
      // Use a UTC midnight timestamp and check the structure rather than exact
      // local values, since local timezone offsets vary by environment
      const result = formatTimestamp("2026-03-18T09:22:00Z");
      eq(typeof result, "string");
      eq(/\d{1,2} [A-Z][a-z]{2} \d{4} at \d{2}:\d{2}/.test(result), true);
    });

    it("formats the seed lastUpdated timestamp without error", () => {
      const { lastUpdated } = SEED_CATALOGUE_STATE;
      const result = formatTimestamp(lastUpdated as string);
      eq(typeof result, "string");
      eq(result.includes("Mar"), true);
      eq(result.includes("2026"), true);
    });
  });

  describe("bumpVersion", () => {
    it("increments the minor version and resets patch to 0", () => {
      eq(bumpVersion("1.4.2"), "1.5.0");
    });

    it("handles version with minor 0", () => {
      eq(bumpVersion("2.0.0"), "2.1.0");
    });

    it("returns the original string when version does not have three parts", () => {
      eq(bumpVersion("1.4"), "1.4");
    });
  });

  describe("deriveBottomBarMessage", () => {
    it("returns disabled message when no catalogue URL", () => {
      eq(
        deriveBottomBarMessage(false, false, ""),
        "Catalogue features are disabled. Enter a Catalogue URL to enable them.",
      );
    });

    it("returns updating message when update is in progress", () => {
      eq(deriveBottomBarMessage(true, true, ""), "Updating catalogue\u2026");
    });

    it("returns status message when idle with catalogue URL", () => {
      eq(
        deriveBottomBarMessage(true, false, "Catalogue updated successfully."),
        "Catalogue updated successfully.",
      );
    });

    it("returns empty string when idle with no status message", () => {
      eq(deriveBottomBarMessage(true, false, ""), "");
    });

    it("disabled message takes priority over updating state", () => {
      eq(
        deriveBottomBarMessage(false, true, ""),
        "Catalogue features are disabled. Enter a Catalogue URL to enable them.",
      );
    });
  });
});
