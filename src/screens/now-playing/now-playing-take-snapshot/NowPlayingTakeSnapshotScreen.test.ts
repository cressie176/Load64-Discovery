import { equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import type { BottomBarStatus } from "./types.ts";

function normaliseName(name: string): string {
  return name.trim().toLowerCase();
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
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (/[/\\:*?"<>|]/.test(trimmed)) return false;
  return true;
}

function buildBottomBarText(status: BottomBarStatus): string {
  switch (status.kind) {
    case "idle":
      return "";
    case "saved":
      return `Snapshot saved: ${status.filename}`;
    case "error":
      return `Failed to save snapshot: ${status.reason}`;
  }
}

describe("NowPlayingTakeSnapshotScreen", () => {
  describe("toFilename", () => {
    it("lowercases the name, appends timestamp and .vsf", () => {
      eq(
        toFilename("Gameplay", "2026-03-29-14-32-11"),
        "gameplay-2026-03-29-14-32-11.vsf",
      );
    });

    it("trims whitespace before converting", () => {
      eq(
        toFilename("  Loading  ", "2026-03-29-14-32-11"),
        "loading-2026-03-29-14-32-11.vsf",
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
      ok(isNameValid("Gameplay"));
    });

    it("returns false for an empty string", () => {
      eq(isNameValid(""), false);
    });

    it("returns false for a whitespace-only string", () => {
      eq(isNameValid("   "), false);
    });

    it("returns false when name contains a forward slash", () => {
      eq(isNameValid("game/play"), false);
    });

    it("returns false when name contains a backslash", () => {
      eq(isNameValid("game\\play"), false);
    });

    it("returns false when name contains a colon", () => {
      eq(isNameValid("game:play"), false);
    });

    it("returns false when name contains an asterisk", () => {
      eq(isNameValid("game*play"), false);
    });

    it("returns false when name contains a question mark", () => {
      eq(isNameValid("game?play"), false);
    });

    it("returns false when name contains a double quote", () => {
      eq(isNameValid('game"play'), false);
    });

    it("returns false when name contains a less-than sign", () => {
      eq(isNameValid("game<play"), false);
    });

    it("returns false when name contains a greater-than sign", () => {
      eq(isNameValid("game>play"), false);
    });

    it("returns false when name contains a pipe", () => {
      eq(isNameValid("game|play"), false);
    });
  });

  describe("buildBottomBarText", () => {
    it("returns empty string for idle status", () => {
      eq(buildBottomBarText({ kind: "idle" }), "");
    });

    it("returns saved message with filename", () => {
      eq(
        buildBottomBarText({
          kind: "saved",
          filename: "gameplay-2026-03-29-14-32-11.vsf",
        }),
        "Snapshot saved: gameplay-2026-03-29-14-32-11.vsf",
      );
    });

    it("returns error message with reason", () => {
      eq(
        buildBottomBarText({ kind: "error", reason: "Disk full" }),
        "Failed to save snapshot: Disk full",
      );
    });
  });
});
