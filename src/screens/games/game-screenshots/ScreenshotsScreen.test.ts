import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import type { GameDetails } from "../game-details/types.ts";

type ScreenshotSlot = "loading" | "title" | "gameplay";

function deriveScreenTitle(
  importMode: boolean,
  gameTitle: string,
  importTitle?: string,
): string {
  if (importMode) {
    const title = importTitle ?? gameTitle;
    return `Import Games > ${title} > Media > Screenshots`;
  }
  return `${gameTitle} > Media > Screenshots`;
}

function deriveSlotLabel(slot: ScreenshotSlot): string {
  switch (slot) {
    case "loading":
      return "Loading";
    case "title":
      return "Title";
    case "gameplay":
      return "Gameplay";
  }
}

function deriveSlotDeleteLabel(slot: ScreenshotSlot): string {
  return `Delete ${deriveSlotLabel(slot)} image`;
}

function deriveAssignedUrl(
  game: GameDetails,
  slot: ScreenshotSlot,
): string | undefined {
  return game.screenshots.find((s) => s.slot === slot)?.url;
}

const GAME: GameDetails = {
  id: "game-test",
  title: "Jet Set Willy",
  publisher: "Software Projects",
  year: 1984,
  colourEncoding: "pal",
  trueDriveEmulation: false,
  screenshots: [
    { slot: "loading", url: "https://example.com/loading.jpg" },
    { slot: "title", url: "https://example.com/title.jpg" },
    { slot: "gameplay", url: "https://example.com/gameplay.jpg" },
  ],
  sources: [],
  hasRom: true,
  hasQuickstart: false,
  hasContinue: false,
  hasAnySnapshot: false,
  inheritDefaultProfile: false,
};

describe("ScreenshotsScreen", () => {
  describe("deriveScreenTitle", () => {
    it("returns standard mode title", () => {
      eq(
        deriveScreenTitle(false, "Jet Set Willy"),
        "Jet Set Willy > Media > Screenshots",
      );
    });

    it("returns import mode title using game title", () => {
      eq(
        deriveScreenTitle(true, "Jet Set Willy"),
        "Import Games > Jet Set Willy > Media > Screenshots",
      );
    });

    it("returns import mode title using importTitle override", () => {
      eq(
        deriveScreenTitle(true, "Jet Set Willy", "JET SET WILLY"),
        "Import Games > JET SET WILLY > Media > Screenshots",
      );
    });
  });

  describe("deriveSlotLabel", () => {
    it("returns Loading for loading slot", () => {
      eq(deriveSlotLabel("loading"), "Loading");
    });

    it("returns Title for title slot", () => {
      eq(deriveSlotLabel("title"), "Title");
    });

    it("returns Gameplay for gameplay slot", () => {
      eq(deriveSlotLabel("gameplay"), "Gameplay");
    });
  });

  describe("deriveSlotDeleteLabel", () => {
    it("returns delete label for loading slot", () => {
      eq(deriveSlotDeleteLabel("loading"), "Delete Loading image");
    });

    it("returns delete label for title slot", () => {
      eq(deriveSlotDeleteLabel("title"), "Delete Title image");
    });

    it("returns delete label for gameplay slot", () => {
      eq(deriveSlotDeleteLabel("gameplay"), "Delete Gameplay image");
    });
  });

  describe("deriveAssignedUrl", () => {
    it("returns url for loading slot", () => {
      eq(deriveAssignedUrl(GAME, "loading"), "https://example.com/loading.jpg");
    });

    it("returns url for title slot", () => {
      eq(deriveAssignedUrl(GAME, "title"), "https://example.com/title.jpg");
    });

    it("returns url for gameplay slot", () => {
      eq(
        deriveAssignedUrl(GAME, "gameplay"),
        "https://example.com/gameplay.jpg",
      );
    });

    it("returns undefined when slot is not assigned", () => {
      const game: GameDetails = { ...GAME, screenshots: [] };
      eq(deriveAssignedUrl(game, "loading"), undefined);
    });
  });
});
