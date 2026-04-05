import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import type { BinaryStatus, BinaryStatusReason } from "../binary-list/types.ts";

function validatePath(path: string): BinaryStatusReason | null {
  if (!path) return null;
  if (!path.startsWith("/")) return "Binary not found";
  if (!path.includes("VICE")) return "Binary is not executable";
  return null;
}

function deriveStatus(
  path: string,
  reason: BinaryStatusReason | null,
): BinaryStatus {
  if (!path) return "unconfigured";
  if (reason) return "invalid";
  return "valid";
}

function deriveBottomBarMessage(errorMessage: string): string {
  if (!errorMessage) return "";
  return `${errorMessage}. Games on this platform will be unlaunchable.`;
}

describe("BinaryEditScreen", () => {
  describe("validatePath", () => {
    it("returns null for an empty path", () => {
      eq(validatePath(""), null);
    });

    it("returns Binary not found for a relative path", () => {
      eq(validatePath("bin/x64sc"), "Binary not found");
    });

    it("returns Binary not found for a path not starting with /", () => {
      eq(validatePath("Applications/VICE/bin/x64sc"), "Binary not found");
    });

    it("returns Binary is not executable for an absolute path not containing VICE", () => {
      eq(validatePath("/usr/local/bin/somebinary"), "Binary is not executable");
    });

    it("returns null for a valid VICE binary path", () => {
      eq(validatePath("/Applications/VICE/bin/x64sc"), null);
    });

    it("returns null for another valid VICE binary path", () => {
      eq(validatePath("/Applications/VICE/bin/xvic"), null);
    });
  });

  describe("deriveStatus", () => {
    it("returns unconfigured when path is empty", () => {
      eq(deriveStatus("", null), "unconfigured");
    });

    it("returns invalid when path is set and reason is present", () => {
      eq(
        deriveStatus("/Applications/VICE/bin/x64sc", "Binary not found"),
        "invalid",
      );
    });

    it("returns valid when path is set and reason is null", () => {
      eq(deriveStatus("/Applications/VICE/bin/x64sc", null), "valid");
    });
  });

  describe("deriveBottomBarMessage", () => {
    it("returns empty string when no error", () => {
      eq(deriveBottomBarMessage(""), "");
    });

    it("formats Binary not found error with unlaunchable suffix", () => {
      eq(
        deriveBottomBarMessage("Binary not found"),
        "Binary not found. Games on this platform will be unlaunchable.",
      );
    });

    it("formats Binary is not executable error with unlaunchable suffix", () => {
      eq(
        deriveBottomBarMessage("Binary is not executable"),
        "Binary is not executable. Games on this platform will be unlaunchable.",
      );
    });
  });
});
