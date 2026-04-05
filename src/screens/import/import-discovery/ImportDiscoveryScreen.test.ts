import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import type { ImportSuggestion } from "./types";

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

function commonPrefix(filenames: string[]): string {
  const first = filenames[0];
  let prefix = "";
  for (let i = 0; i < first.length; i++) {
    if (filenames.every((f) => f[i] === first[i])) {
      prefix += first[i];
    } else {
      break;
    }
  }
  return prefix.replace(/[-_\s]+$/, "");
}

function formatTitle(suggestion: ImportSuggestion): string {
  if (suggestion.title !== null) return suggestion.title;
  if (suggestion.filenames.length === 1) {
    return stripExtension(suggestion.filenames[0]);
  }
  return commonPrefix(suggestion.filenames.map(stripExtension));
}

function formatPublisher(publisher: string | null): string {
  return publisher ?? "—";
}

function formatYear(year: number | null): string {
  return year !== null ? String(year) : "—";
}

describe("ImportDiscoveryScreen", () => {
  describe("formatTitle", () => {
    it("returns the title for a recognised game", () => {
      const suggestion: ImportSuggestion = {
        id: "sug-1",
        title: "The Last Ninja",
        publisher: "System 3",
        year: 1987,
        romCount: 3,
        filenames: ["last-ninja-1.d64", "last-ninja-2.d64", "last-ninja-3.d64"],
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
        filenames: ["game-tape2.t64"],
      };
      eq(formatTitle(suggestion), "game-tape2");
    });

    it("returns the common filename prefix for an unrecognised multi-ROM game", () => {
      const suggestion: ImportSuggestion = {
        id: "sug-3",
        title: null,
        publisher: null,
        year: null,
        romCount: 2,
        filenames: ["last-ninja-1.d64", "last-ninja-2.d64"],
      };
      eq(formatTitle(suggestion), "last-ninja");
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
});
