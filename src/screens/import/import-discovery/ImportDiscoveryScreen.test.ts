import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_IMPORT_DISCOVERY } from "./seed.ts";
import { deriveUnrecognisedTitle } from "./title.ts";
import type { ImportSuggestion } from "./types";

function formatTitle(suggestion: ImportSuggestion): string {
  if (suggestion.title !== null) return suggestion.title;
  return deriveUnrecognisedTitle(suggestion.roms);
}

function formatPublisher(publisher: string | null): string {
  return publisher ?? "—";
}

function formatYear(year: number | null): string {
  return year !== null ? String(year) : "—";
}

describe("ImportDiscoveryScreen", () => {
  describe("deriveUnrecognisedTitle", () => {
    it("returns a dash for an empty roms array", () => {
      eq(deriveUnrecognisedTitle([]), "—");
    });

    it("returns the filename without extension for a single ROM", () => {
      eq(deriveUnrecognisedTitle(["turrican2.d64"]), "turrican2");
    });

    it("strips extension from single ROM with .tap extension", () => {
      eq(deriveUnrecognisedTitle(["game-tape.tap"]), "game-tape");
    });

    it("returns the common prefix for multiple ROMs", () => {
      eq(
        deriveUnrecognisedTitle(["last-ninja-1.d64", "last-ninja-2.d64"]),
        "last-ninja",
      );
    });

    it("strips trailing hyphens from the common prefix", () => {
      eq(
        deriveUnrecognisedTitle(["game-tape2-1.tap", "game-tape2-2.tap"]),
        "game-tape2",
      );
    });

    it("returns a dash when the common prefix reduces to empty", () => {
      eq(deriveUnrecognisedTitle(["abc.d64", "xyz.d64"]), "—");
    });

    it("handles files without an extension", () => {
      eq(deriveUnrecognisedTitle(["mygame"]), "mygame");
    });
  });

  describe("formatTitle", () => {
    it("returns the title for a recognised game", () => {
      const suggestion: ImportSuggestion = {
        id: "sug-1",
        title: "The Last Ninja",
        publisher: "System 3",
        year: 1987,
        romCount: 3,
        roms: ["last-ninja-1.d64", "last-ninja-2.d64", "last-ninja-3.d64"],
      };
      eq(formatTitle(suggestion), "The Last Ninja");
    });

    it("returns the filename without extension for an unrecognised single-ROM game", () => {
      const suggestion: ImportSuggestion = {
        id: "sug-2",
        title: null,
        publisher: null,
        year: null,
        romCount: 1,
        roms: ["turrican2.d64"],
      };
      eq(formatTitle(suggestion), "turrican2");
    });

    it("returns the common filename prefix for an unrecognised multi-ROM game", () => {
      const suggestion: ImportSuggestion = {
        id: "sug-3",
        title: null,
        publisher: null,
        year: null,
        romCount: 2,
        roms: ["game-tape2-1.tap", "game-tape2-2.tap"],
      };
      eq(formatTitle(suggestion), "game-tape2");
    });
  });

  describe("formatPublisher", () => {
    it("returns the publisher name when present", () => {
      eq(formatPublisher("Ocean"), "Ocean");
    });

    it("returns a dash when publisher is null", () => {
      eq(formatPublisher(null), "—");
    });
  });

  describe("formatYear", () => {
    it("returns the year as a string when present", () => {
      eq(formatYear(1987), "1987");
    });

    it("returns a dash when year is null", () => {
      eq(formatYear(null), "—");
    });
  });

  describe("SEED_IMPORT_DISCOVERY", () => {
    it("all sample suggestions have a roms array", () => {
      for (const s of SEED_IMPORT_DISCOVERY.sample) {
        eq(Array.isArray(s.roms), true);
      }
    });

    it("unrecognised sample suggestions derive a non-dash title", () => {
      const unrecognised = SEED_IMPORT_DISCOVERY.sample.filter(
        (s) => s.title === null,
      );
      for (const s of unrecognised) {
        const title = deriveUnrecognisedTitle(s.roms);
        eq(title !== "—", true, `expected a derived title for ${s.id}`);
      }
    });

    it("rom count matches roms array length for each sample suggestion", () => {
      for (const s of SEED_IMPORT_DISCOVERY.sample) {
        eq(s.romCount, s.roms.length, `romCount mismatch for ${s.id}`);
      }
    });
  });
});
