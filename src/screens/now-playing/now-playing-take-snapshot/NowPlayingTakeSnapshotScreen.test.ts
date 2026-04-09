import { equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";

function normaliseName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toFilename(name: string, timestamp: string): string {
  return `${normaliseName(name)}-${timestamp}.vsf`;
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("-");
}

function isNameValid(name: string): boolean {
  return normaliseName(name).length > 0;
}

describe("NowPlayingTakeSnapshotScreen", () => {
  describe("normaliseName", () => {
    it("lowercases the name", () => {
      eq(normaliseName("Gameplay"), "gameplay");
    });

    it("trims whitespace", () => {
      eq(normaliseName("  save  "), "save");
    });

    it("replaces spaces with hyphens", () => {
      eq(normaliseName("my save"), "my-save");
    });

    it("collapses multiple separators into one hyphen", () => {
      eq(normaliseName("a  b"), "a-b");
    });

    it("strips leading and trailing hyphens", () => {
      eq(normaliseName("!save!"), "save");
    });

    it("preserves underscores", () => {
      eq(normaliseName("my_save"), "my_save");
    });

    it("replaces invalid characters with hyphens", () => {
      eq(normaliseName("game/play"), "game-play");
    });
  });

  describe("toFilename", () => {
    it("normalises the name, appends timestamp and .vsf", () => {
      eq(
        toFilename("save", "2026-03-29-14-32-11"),
        "save-2026-03-29-14-32-11.vsf",
      );
    });

    it("normalises mixed-case names with spaces", () => {
      eq(
        toFilename("My Save", "2026-03-29-14-32-11"),
        "my-save-2026-03-29-14-32-11.vsf",
      );
    });
  });

  describe("formatTimestamp", () => {
    it("formats a date as YYYY-MM-DD-HH-MM-SS", () => {
      const date = new Date(2026, 2, 29, 14, 32, 11);
      eq(formatTimestamp(date), "2026-03-29-14-32-11");
    });

    it("zero-pads month, day, hour, minute, and second", () => {
      const date = new Date(2026, 0, 5, 9, 3, 7);
      eq(formatTimestamp(date), "2026-01-05-09-03-07");
    });
  });

  describe("isNameValid", () => {
    it("returns true for a plain name", () => {
      ok(isNameValid("save"));
    });

    it("returns true for a name with special chars that normalise to something", () => {
      ok(isNameValid("my save!"));
    });

    it("returns false for an empty string", () => {
      eq(isNameValid(""), false);
    });

    it("returns false for a whitespace-only string", () => {
      eq(isNameValid("   "), false);
    });

    it("returns false for a string that normalises to empty", () => {
      eq(isNameValid("!!!"), false);
    });
  });
});
