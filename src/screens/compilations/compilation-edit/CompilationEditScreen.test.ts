import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_COMPILATIONS } from "../compilation-list/seed.ts";

function validateCompilationName(
  name: string,
  existingNames: string[],
  currentName: string | undefined,
): string {
  const trimmed = name.trim();
  if (!trimmed) return "Compilation name is required.";
  if (trimmed === "All Games") return 'Compilation name cannot be "All Games".';
  if (trimmed !== currentName && existingNames.includes(trimmed)) {
    return `A compilation named "${trimmed}" already exists.`;
  }
  return "";
}

function generateCompilationId(name: string): string {
  return `compilation-${name.trim().toLowerCase().replace(/\s+/g, "-")}`;
}

describe("CompilationEditScreen", () => {
  describe("validateCompilationName", () => {
    const existingNames = SEED_COMPILATIONS.compilations.map((c) => c.name);

    it("returns error when name is empty", () => {
      eq(
        validateCompilationName("", existingNames, undefined),
        "Compilation name is required.",
      );
    });

    it("returns error when name is only whitespace", () => {
      eq(
        validateCompilationName("   ", existingNames, undefined),
        "Compilation name is required.",
      );
    });

    it("returns error when name is All Games", () => {
      eq(
        validateCompilationName("All Games", existingNames, undefined),
        'Compilation name cannot be "All Games".',
      );
    });

    it("returns error when name duplicates an existing compilation", () => {
      eq(
        validateCompilationName("Favourites", existingNames, undefined),
        'A compilation named "Favourites" already exists.',
      );
    });

    it("returns no error when name is unique", () => {
      eq(validateCompilationName("Racing Games", existingNames, undefined), "");
    });

    it("returns no error when renaming to the same name as current", () => {
      eq(
        validateCompilationName("Favourites", existingNames, "Favourites"),
        "",
      );
    });

    it("returns error when renaming to a different existing name", () => {
      eq(
        validateCompilationName("Multiplayer", existingNames, "Favourites"),
        'A compilation named "Multiplayer" already exists.',
      );
    });

    it("trims whitespace before validation", () => {
      eq(
        validateCompilationName("  Racing Games  ", existingNames, undefined),
        "",
      );
    });

    it("returns error when trimmed name is All Games", () => {
      eq(
        validateCompilationName("  All Games  ", existingNames, undefined),
        'Compilation name cannot be "All Games".',
      );
    });
  });

  describe("generateCompilationId", () => {
    it("generates id from a simple name", () => {
      eq(generateCompilationId("Favourites"), "compilation-favourites");
    });

    it("converts spaces to hyphens", () => {
      eq(generateCompilationId("Platform Games"), "compilation-platform-games");
    });

    it("lowercases the name", () => {
      eq(generateCompilationId("Shoot-em-ups"), "compilation-shoot-em-ups");
    });

    it("trims leading and trailing whitespace", () => {
      eq(generateCompilationId("  Sports  "), "compilation-sports");
    });

    it("collapses multiple spaces", () => {
      eq(generateCompilationId("A  B"), "compilation-a-b");
    });
  });
});
