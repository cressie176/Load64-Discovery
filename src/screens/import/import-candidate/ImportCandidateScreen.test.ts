import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import type { ImportCandidate } from "./types";

function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot !== -1 ? filename.slice(0, dot) : filename;
}

function commonPrefix(names: string[]): string {
  if (names.length === 0) return "";
  let prefix = names[0];
  for (let i = 1; i < names.length; i++) {
    while (!names[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (prefix === "") return "";
    }
  }
  return prefix.replace(/[-_\s]+$/, "");
}

function deriveTitle(candidate: ImportCandidate): string {
  if (candidate.title !== null) return candidate.title;
  if (candidate.roms.length === 1) {
    const filename = candidate.roms[0].filename;
    return stripExtension(filename);
  }
  return commonPrefix(candidate.roms.map((r) => stripExtension(r.filename)));
}

describe("ImportCandidateScreen", () => {
  describe("deriveTitle", () => {
    it("returns the catalogue title for a recognised game", () => {
      const candidate: ImportCandidate = {
        id: "cand-1",
        title: "The Last Ninja",
        publisher: "System 3",
        year: 1987,
        roms: [
          { label: "Disk 1", filename: "last-ninja-the-disk1.d64" },
          { label: "Disk 2", filename: "last-ninja-the-disk2.d64" },
        ],
      };
      eq(deriveTitle(candidate), "The Last Ninja");
    });

    it("returns the filename without extension for an unrecognised single-ROM game", () => {
      const candidate: ImportCandidate = {
        id: "cand-2",
        title: null,
        publisher: null,
        year: null,
        roms: [{ label: "Disk 1", filename: "manic-miner.d64" }],
      };
      eq(deriveTitle(candidate), "manic-miner");
    });

    it("returns the common filename prefix for an unrecognised multi-ROM game", () => {
      const candidate: ImportCandidate = {
        id: "cand-3",
        title: null,
        publisher: null,
        year: null,
        roms: [
          { label: "Disk 1", filename: "turrican2-1.d64" },
          { label: "Disk 2", filename: "turrican2-2.d64" },
        ],
      };
      eq(deriveTitle(candidate), "turrican2");
    });

    it("strips trailing separators from the common prefix", () => {
      const candidate: ImportCandidate = {
        id: "cand-4",
        title: null,
        publisher: null,
        year: null,
        roms: [
          { label: "Disk 1", filename: "last-ninja-1.d64" },
          { label: "Disk 2", filename: "last-ninja-2.d64" },
        ],
      };
      eq(deriveTitle(candidate), "last-ninja");
    });
  });

  describe("stripExtension", () => {
    it("removes the file extension", () => {
      eq(stripExtension("game.d64"), "game");
    });

    it("returns the name unchanged if there is no extension", () => {
      eq(stripExtension("game"), "game");
    });

    it("handles filenames with multiple dots", () => {
      eq(stripExtension("last.ninja.d64"), "last.ninja");
    });
  });

  describe("commonPrefix", () => {
    it("returns the common prefix of all names", () => {
      eq(commonPrefix(["turrican2-1", "turrican2-2"]), "turrican2");
    });

    it("returns an empty string when there is no common prefix", () => {
      eq(commonPrefix(["aaa", "bbb"]), "");
    });

    it("returns an empty string for an empty array", () => {
      eq(commonPrefix([]), "");
    });
  });
});
