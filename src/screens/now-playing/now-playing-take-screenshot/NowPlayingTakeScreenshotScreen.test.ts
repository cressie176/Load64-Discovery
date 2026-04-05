import { equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import type { BottomBarStatus } from "./types.ts";

function normaliseName(name: string): string {
  return name.trim().toLowerCase();
}

function toFilename(name: string): string {
  return `${normaliseName(name)}.png`;
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
      return `Screenshot saved: ${status.filename}`;
    case "error":
      return `Failed to save screenshot: ${status.reason}`;
  }
}

describe("NowPlayingTakeScreenshotScreen", () => {
  describe("toFilename", () => {
    it("lowercases the name and appends .png", () => {
      eq(toFilename("Gameplay Screen"), "gameplay screen.png");
    });

    it("trims whitespace before converting", () => {
      eq(toFilename("  Loading  "), "loading.png");
    });
  });

  describe("isNameValid", () => {
    it("returns true for a plain name", () => {
      ok(isNameValid("Gameplay Screen"));
    });

    it("returns false for an empty string", () => {
      eq(isNameValid(""), false);
    });

    it("returns false for a whitespace-only string", () => {
      eq(isNameValid("   "), false);
    });

    it("returns false when name contains a forward slash", () => {
      eq(isNameValid("screen/shot"), false);
    });

    it("returns false when name contains a backslash", () => {
      eq(isNameValid("screen\\shot"), false);
    });

    it("returns false when name contains a colon", () => {
      eq(isNameValid("screen:shot"), false);
    });

    it("returns false when name contains an asterisk", () => {
      eq(isNameValid("screen*shot"), false);
    });

    it("returns false when name contains a question mark", () => {
      eq(isNameValid("screen?shot"), false);
    });

    it("returns false when name contains a double quote", () => {
      eq(isNameValid('screen"shot'), false);
    });

    it("returns false when name contains a less-than sign", () => {
      eq(isNameValid("screen<shot"), false);
    });

    it("returns false when name contains a greater-than sign", () => {
      eq(isNameValid("screen>shot"), false);
    });

    it("returns false when name contains a pipe", () => {
      eq(isNameValid("screen|shot"), false);
    });
  });

  describe("buildBottomBarText", () => {
    it("returns empty string for idle status", () => {
      eq(buildBottomBarText({ kind: "idle" }), "");
    });

    it("returns saved message with filename", () => {
      eq(
        buildBottomBarText({ kind: "saved", filename: "gameplay.png" }),
        "Screenshot saved: gameplay.png",
      );
    });

    it("returns error message with reason", () => {
      eq(
        buildBottomBarText({ kind: "error", reason: "Disk full" }),
        "Failed to save screenshot: Disk full",
      );
    });
  });
});
