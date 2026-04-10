import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";

type SourceMode = "file" | "url";

function deriveScreenTitle(
  gameTitle: string,
  slotName: string,
  _mode: SourceMode,
): string {
  return `${gameTitle} > Media > ${slotName} > Add`;
}

function deriveFieldLabel(mode: SourceMode): string {
  return mode === "file" ? "File *" : "URL *";
}

function deriveSubmitLabel(mode: SourceMode): string {
  return mode === "file" ? "Select" : "Download";
}

function validate(value: string): string | null {
  if (!value.trim()) return "This field is required.";
  return null;
}

describe("GameMediaAddScreen", () => {
  describe("deriveScreenTitle", () => {
    it("returns breadcrumb for file mode", () => {
      eq(
        deriveScreenTitle("Bubble Bobble", "Cover Thumbnail", "file"),
        "Bubble Bobble > Media > Cover Thumbnail > Add",
      );
    });

    it("returns breadcrumb for url mode", () => {
      eq(
        deriveScreenTitle("Elite", "Loading Screen", "url"),
        "Elite > Media > Loading Screen > Add",
      );
    });

    it("uses the game title in the breadcrumb", () => {
      eq(
        deriveScreenTitle("The Last Ninja", "Gameplay Screen", "file"),
        "The Last Ninja > Media > Gameplay Screen > Add",
      );
    });
  });

  describe("deriveFieldLabel", () => {
    it("returns File * for file mode", () => {
      eq(deriveFieldLabel("file"), "File *");
    });

    it("returns URL * for url mode", () => {
      eq(deriveFieldLabel("url"), "URL *");
    });
  });

  describe("deriveSubmitLabel", () => {
    it("returns Select for file mode", () => {
      eq(deriveSubmitLabel("file"), "Select");
    });

    it("returns Download for url mode", () => {
      eq(deriveSubmitLabel("url"), "Download");
    });
  });

  describe("validate", () => {
    it("returns error when value is empty", () => {
      eq(validate(""), "This field is required.");
    });

    it("returns error when value is only whitespace", () => {
      eq(validate("   "), "This field is required.");
    });

    it("returns null when value is non-empty", () => {
      eq(validate("/path/to/image.jpg"), null);
    });

    it("returns null when value is a URL", () => {
      eq(validate("https://example.com/image.png"), null);
    });
  });
});
