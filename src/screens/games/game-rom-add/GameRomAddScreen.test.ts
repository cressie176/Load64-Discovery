import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveLabel, isSupportedRomFile } from "../game-rom-edit/utils.ts";

interface ExistingRom {
  filename: string;
  label: string;
}

function validateAddRom(
  file: string,
  label: string,
  existing: ExistingRom[] = [],
): string {
  const trimmedFile = file.trim();
  const trimmedLabel = label.trim();
  if (!trimmedFile) return "File is required.";
  if (!isSupportedRomFile(trimmedFile))
    return "File must be a supported ROM type (.d64, .d71, .d81, .tap, .t64, .crt).";
  const basename = trimmedFile.includes("/")
    ? (trimmedFile.split("/").pop() ?? trimmedFile)
    : trimmedFile;
  if (existing.some((r) => r.filename.toLowerCase() === basename.toLowerCase()))
    return "A ROM with this file already exists.";
  if (!trimmedLabel) return "Label is required.";
  if (
    existing.some((r) => r.label.toLowerCase() === trimmedLabel.toLowerCase())
  )
    return "A ROM with this label already exists.";
  return "";
}

describe("GameRomAddScreen", () => {
  describe("validateAddRom", () => {
    it("returns file required error when file is empty", () => {
      eq(validateAddRom("", "Disk 1"), "File is required.");
    });

    it("returns file required error when file is whitespace only", () => {
      eq(validateAddRom("   ", "Disk 1"), "File is required.");
    });

    it("returns unsupported type error for .bin file", () => {
      eq(
        validateAddRom("game.bin", "Disk 1"),
        "File must be a supported ROM type (.d64, .d71, .d81, .tap, .t64, .crt).",
      );
    });

    it("returns unsupported type error for .zip file", () => {
      eq(
        validateAddRom("game.zip", "Disk 1"),
        "File must be a supported ROM type (.d64, .d71, .d81, .tap, .t64, .crt).",
      );
    });

    it("returns duplicate file error when filename already exists", () => {
      const existing = [{ filename: "game-disk1.d64", label: "Disk 1" }];
      eq(
        validateAddRom("game-disk1.d64", "Disk 2", existing),
        "A ROM with this file already exists.",
      );
    });

    it("extracts basename from path before checking for duplicate file", () => {
      const existing = [{ filename: "game-disk1.d64", label: "Disk 1" }];
      eq(
        validateAddRom("/home/user/roms/game-disk1.d64", "Disk 2", existing),
        "A ROM with this file already exists.",
      );
    });

    it("duplicate file check is case-insensitive", () => {
      const existing = [{ filename: "game-disk1.d64", label: "Disk 1" }];
      eq(
        validateAddRom("GAME-DISK1.D64", "Disk 2", existing),
        "A ROM with this file already exists.",
      );
    });

    it("returns label required error when label is empty", () => {
      eq(validateAddRom("game.d64", ""), "Label is required.");
    });

    it("returns label required error when label is whitespace only", () => {
      eq(validateAddRom("game.d64", "   "), "Label is required.");
    });

    it("returns duplicate label error when label already exists", () => {
      const existing = [{ filename: "game-disk1.d64", label: "Disk 1" }];
      eq(
        validateAddRom("game-disk2.d64", "Disk 1", existing),
        "A ROM with this label already exists.",
      );
    });

    it("duplicate label check is case-insensitive", () => {
      const existing = [{ filename: "game-disk1.d64", label: "Disk 1" }];
      eq(
        validateAddRom("game-disk2.d64", "disk 1", existing),
        "A ROM with this label already exists.",
      );
    });

    it("returns empty string when file and label are both valid and unique", () => {
      const existing = [{ filename: "game-disk1.d64", label: "Disk 1" }];
      eq(validateAddRom("game-disk2.d64", "Disk 2", existing), "");
    });

    it("returns empty string with no existing ROMs", () => {
      eq(validateAddRom("game.d64", "Disk 1"), "");
    });

    it("file validation takes priority over label validation", () => {
      eq(validateAddRom("", ""), "File is required.");
    });

    it("type validation takes priority over label validation", () => {
      eq(
        validateAddRom("game.bin", ""),
        "File must be a supported ROM type (.d64, .d71, .d81, .tap, .t64, .crt).",
      );
    });

    it("duplicate file error takes priority over label required", () => {
      const existing = [{ filename: "game-disk1.d64", label: "Disk 1" }];
      eq(
        validateAddRom("game-disk1.d64", "", existing),
        "A ROM with this file already exists.",
      );
    });
  });

  describe("label derivation for add screen", () => {
    it("derives Disk 1 when adding the first disk ROM", () => {
      eq(deriveLabel("game.d64", true), "Disk 1");
    });

    it("derives Disk 2 from filename when not the only ROM", () => {
      eq(deriveLabel("game-disk2.d64", false), "Disk 2");
    });

    it("derives Tape 1 when adding the first tape ROM", () => {
      eq(deriveLabel("game.tap", true), "Tape 1");
    });

    it("derives Cartridge 1 when adding the first cartridge ROM", () => {
      eq(deriveLabel("game.crt", true), "Cartridge 1");
    });

    it("uses filename fallback when no number and not the only ROM", () => {
      eq(deriveLabel("elite.d64", false), "elite");
    });

    it("strips path prefix before deriving label", () => {
      eq(deriveLabel("/home/user/roms/game-disk1.d64", false), "Disk 1");
    });
  });
});
