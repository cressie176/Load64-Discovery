import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";

function validatePath(path: string): string | null {
  if (!path.trim()) return "Path is required.";
  return null;
}

describe("ImportGamesScreen", () => {
  describe("validatePath", () => {
    it("returns an error for an empty path", () => {
      eq(validatePath(""), "Path is required.");
    });

    it("returns an error for a whitespace-only path", () => {
      eq(validatePath("   "), "Path is required.");
    });

    it("returns null for a non-empty path", () => {
      eq(validatePath("/Users/me/Downloads/roms/"), null);
    });

    it("returns null for a path with leading and trailing spaces", () => {
      eq(validatePath("  /Users/me/roms  "), null);
    });
  });
});
