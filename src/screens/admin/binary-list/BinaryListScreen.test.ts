import { deepStrictEqual as deep, equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_BINARIES } from "./seed.ts";
import type { Binary, BinaryList } from "./types.ts";

const MACHINE_ORDER = [
  "Commodore 64",
  "C64 DTV",
  "Commodore 128",
  "VIC-20",
  "Commodore Plus/4",
  "Commodore PET",
  "CBM-II",
  "CBM 5x0",
  "SuperCPU 64",
];

function statusSymbol(binary: Binary): string {
  if (binary.status === "valid") return "✓";
  if (binary.status === "invalid") return "✗";
  return "—";
}

function deriveBottomBarMessage(binary: Binary | undefined): string {
  if (!binary) return "";
  if (binary.status === "invalid" && binary.statusReason) {
    return `${binary.statusReason}. Games on this platform will be unlaunchable.`;
  }
  return "";
}

describe("BinaryListScreen", () => {
  describe("SEED_BINARIES", () => {
    it("has exactly 9 entries", () => {
      eq(SEED_BINARIES.length, 9);
    });

    it("machines appear in the correct fixed order", () => {
      const names = SEED_BINARIES.map((b) => b.machineName);
      deep(names, MACHINE_ORDER);
    });

    it("each entry has a valid status", () => {
      const validStatuses = new Set(["valid", "invalid", "unconfigured"]);
      for (const binary of SEED_BINARIES) {
        eq(validStatuses.has(binary.status), true);
      }
    });

    it("unconfigured entries have null path and null statusReason", () => {
      const unconfigured = SEED_BINARIES.filter(
        (b) => b.status === "unconfigured",
      );
      for (const binary of unconfigured) {
        eq(binary.path, null);
        eq(binary.statusReason, null);
      }
    });

    it("valid entries have a non-null path and null statusReason", () => {
      const valid = SEED_BINARIES.filter((b) => b.status === "valid");
      for (const binary of valid) {
        eq(typeof binary.path, "string");
        eq(binary.statusReason, null);
      }
    });

    it("invalid entries have a non-null path and a statusReason", () => {
      const invalid = SEED_BINARIES.filter((b) => b.status === "invalid");
      for (const binary of invalid) {
        eq(typeof binary.path, "string");
        eq(typeof binary.statusReason, "string");
      }
    });

    it("has at least one valid entry", () => {
      const valid = SEED_BINARIES.filter((b) => b.status === "valid");
      eq(valid.length > 0, true);
    });

    it("has at least one invalid entry to exercise error display", () => {
      const invalid = SEED_BINARIES.filter((b) => b.status === "invalid");
      eq(invalid.length > 0, true);
    });
  });

  describe("statusSymbol", () => {
    it("returns ✓ for valid binaries", () => {
      const binary: Binary = {
        machineName: "Commodore 64",
        path: "/Applications/VICE/bin/x64sc",
        status: "valid",
        statusReason: null,
      };
      eq(statusSymbol(binary), "✓");
    });

    it("returns ✗ for invalid binaries", () => {
      const binary: Binary = {
        machineName: "VIC-20",
        path: "/Applications/VICE/bin/xvic",
        status: "invalid",
        statusReason: "Binary not found",
      };
      eq(statusSymbol(binary), "✗");
    });

    it("returns — for unconfigured binaries", () => {
      const binary: Binary = {
        machineName: "C64 DTV",
        path: null,
        status: "unconfigured",
        statusReason: null,
      };
      eq(statusSymbol(binary), "—");
    });
  });

  describe("deriveBottomBarMessage", () => {
    it("returns empty string when binary is undefined", () => {
      eq(deriveBottomBarMessage(undefined), "");
    });

    it("returns empty string for valid binary", () => {
      const binary: Binary = {
        machineName: "Commodore 64",
        path: "/Applications/VICE/bin/x64sc",
        status: "valid",
        statusReason: null,
      };
      eq(deriveBottomBarMessage(binary), "");
    });

    it("returns empty string for unconfigured binary", () => {
      const binary: Binary = {
        machineName: "C64 DTV",
        path: null,
        status: "unconfigured",
        statusReason: null,
      };
      eq(deriveBottomBarMessage(binary), "");
    });

    it("returns error message for invalid binary with Binary not found reason", () => {
      const binary: Binary = {
        machineName: "VIC-20",
        path: "/Applications/VICE/bin/xvic",
        status: "invalid",
        statusReason: "Binary not found",
      };
      eq(
        deriveBottomBarMessage(binary),
        "Binary not found. Games on this platform will be unlaunchable.",
      );
    });

    it("returns error message for invalid binary with Binary is not executable reason", () => {
      const binary: Binary = {
        machineName: "Commodore 128",
        path: "/Applications/VICE/bin/x128",
        status: "invalid",
        statusReason: "Binary is not executable",
      };
      eq(
        deriveBottomBarMessage(binary),
        "Binary is not executable. Games on this platform will be unlaunchable.",
      );
    });
  });

  describe("BinaryList type", () => {
    it("accepts an array of Binary entries", () => {
      const list: BinaryList = [
        {
          machineName: "Commodore 64",
          path: "/Applications/VICE/bin/x64sc",
          status: "valid",
          statusReason: null,
        },
        {
          machineName: "C64 DTV",
          path: null,
          status: "unconfigured",
          statusReason: null,
        },
      ];
      eq(list.length, 2);
    });
  });
});
