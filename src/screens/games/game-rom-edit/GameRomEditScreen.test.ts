import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveLabel, isSupportedRomFile } from "./utils.ts";

describe("deriveLabel", () => {
  describe("filename pattern — disk", () => {
    it("extracts number from disk filename", () => {
      eq(deriveLabel("last-ninja-disk1.d64", false), "Disk 1");
    });

    it("extracts number from filename with underscore", () => {
      eq(deriveLabel("game_disk2.d64", false), "Disk 2");
    });

    it("extracts number from d71 extension", () => {
      eq(deriveLabel("game-disk3.d71", false), "Disk 3");
    });

    it("extracts number from d81 extension", () => {
      eq(deriveLabel("game-disk4.d81", false), "Disk 4");
    });
  });

  describe("filename pattern — tape", () => {
    it("extracts number from tap filename", () => {
      eq(deriveLabel("game-tape2.tap", false), "Tape 2");
    });

    it("extracts number from t64 filename", () => {
      eq(deriveLabel("game1.t64", false), "Tape 1");
    });
  });

  describe("filename pattern — cartridge", () => {
    it("extracts number from crt filename", () => {
      eq(deriveLabel("game-cart1.crt", false), "Cartridge 1");
    });
  });

  describe("single-ROM fallback", () => {
    it("returns Disk 1 when no number and only ROM", () => {
      eq(deriveLabel("elite.d64", true), "Disk 1");
    });

    it("returns Tape 1 when no number and only ROM", () => {
      eq(deriveLabel("game.tap", true), "Tape 1");
    });

    it("returns Cartridge 1 when no number and only ROM", () => {
      eq(deriveLabel("game.crt", true), "Cartridge 1");
    });
  });

  describe("filename fallback", () => {
    it("uses basename without extension for unknown extension", () => {
      eq(deriveLabel("mygame.bin", false), "mygame");
    });

    it("uses basename when no number and not the only ROM", () => {
      eq(deriveLabel("elite.d64", false), "elite");
    });

    it("strips directory path from label", () => {
      eq(deriveLabel("/home/user/roms/elite.d64", false), "elite");
    });
  });
});

describe("isSupportedRomFile", () => {
  it("accepts .d64", () => {
    eq(isSupportedRomFile("game.d64"), true);
  });

  it("accepts .d71", () => {
    eq(isSupportedRomFile("game.d71"), true);
  });

  it("accepts .d81", () => {
    eq(isSupportedRomFile("game.d81"), true);
  });

  it("accepts .tap", () => {
    eq(isSupportedRomFile("game.tap"), true);
  });

  it("accepts .t64", () => {
    eq(isSupportedRomFile("game.t64"), true);
  });

  it("accepts .crt", () => {
    eq(isSupportedRomFile("game.crt"), true);
  });

  it("rejects .bin", () => {
    eq(isSupportedRomFile("game.bin"), false);
  });

  it("rejects .zip", () => {
    eq(isSupportedRomFile("game.zip"), false);
  });

  it("rejects empty string", () => {
    eq(isSupportedRomFile(""), false);
  });

  it("is case-insensitive", () => {
    eq(isSupportedRomFile("game.D64"), true);
  });
});
