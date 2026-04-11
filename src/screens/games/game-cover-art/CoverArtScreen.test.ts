import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";

function deriveScreenTitle(
  importMode: boolean,
  gameTitle: string,
  importTitle?: string,
): string {
  if (importMode) {
    const title = importTitle ?? gameTitle;
    return `Import Games > ${title} > Cover Art`;
  }
  return `${gameTitle} > Cover Art`;
}

function deriveCoverArtUrl(coverUrl: string | undefined): string | undefined {
  return coverUrl;
}

describe("CoverArtScreen", () => {
  describe("deriveScreenTitle", () => {
    it("returns standard mode title", () => {
      eq(
        deriveScreenTitle(false, "Bubble Bobble"),
        "Bubble Bobble > Cover Art",
      );
    });

    it("returns import mode title using game title", () => {
      eq(
        deriveScreenTitle(true, "Bubble Bobble"),
        "Import Games > Bubble Bobble > Cover Art",
      );
    });

    it("returns import mode title using importTitle override", () => {
      eq(
        deriveScreenTitle(true, "Bubble Bobble", "BUBBLE BOBBLE"),
        "Import Games > BUBBLE BOBBLE > Cover Art",
      );
    });
  });

  describe("deriveCoverArtUrl", () => {
    it("returns coverUrl when present", () => {
      eq(
        deriveCoverArtUrl("https://example.com/cover.jpg"),
        "https://example.com/cover.jpg",
      );
    });

    it("returns undefined when coverUrl is absent", () => {
      eq(deriveCoverArtUrl(undefined), undefined);
    });
  });
});
