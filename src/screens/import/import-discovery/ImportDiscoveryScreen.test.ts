import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import type { ImportSuggestion } from "./types";

function formatTitle(suggestion: ImportSuggestion): string {
  return suggestion.title ?? "—";
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
      };
      eq(formatTitle(suggestion), "The Last Ninja");
    });

    it("returns a dash for an unrecognised game", () => {
      const suggestion: ImportSuggestion = {
        id: "sug-2",
        title: null,
        publisher: null,
        year: null,
        romCount: 2,
      };
      eq(formatTitle(suggestion), "—");
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
