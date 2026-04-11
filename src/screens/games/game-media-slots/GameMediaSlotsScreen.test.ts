import { deepStrictEqual as deep, equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import type { GameDetails } from "../game-details/types.ts";

type MediaSlot =
  | "cover-thumbnail"
  | "loading-screen"
  | "title-screen"
  | "gameplay-screen";

const SLOT_DEFINITIONS: { label: string; slot: MediaSlot }[] = [
  { label: "Cover Thumbnail", slot: "cover-thumbnail" },
  { label: "Loading Screen", slot: "loading-screen" },
  { label: "Title Screen", slot: "title-screen" },
  { label: "Gameplay Screen", slot: "gameplay-screen" },
];

function deriveFilename(url: string | undefined): string {
  if (!url) return "—";
  const lastSegment = url.split("/").pop();
  if (!lastSegment) return "—";
  const [pathPart, query] = lastSegment.split("?");
  if (pathPart && /^[0-9a-f]{6}$/i.test(pathPart) && query) {
    const textParam = new URLSearchParams(query).get("text");
    if (textParam) {
      return `${textParam
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")}.png`;
    }
  }
  return pathPart || "—";
}

function deriveMediaSlots(
  game: GameDetails,
): { label: string; slot: MediaSlot; filename: string }[] {
  return SLOT_DEFINITIONS.map(({ label, slot }) => {
    let url: string | undefined;
    if (slot === "cover-thumbnail") {
      url = game.coverUrl;
    } else if (slot === "loading-screen") {
      url = game.screenshots.find((s) => s.slot === "loading")?.url;
    } else if (slot === "title-screen") {
      url = game.screenshots.find((s) => s.slot === "title")?.url;
    } else {
      url = game.screenshots.find((s) => s.slot === "gameplay")?.url;
    }
    return { label, slot, filename: deriveFilename(url) };
  });
}

const FULL_GAME: GameDetails = {
  id: "game-test",
  title: "Test Game",
  publisher: "Test Publisher",
  year: 1990,
  coverUrl: "https://example.com/images/cover.jpg",
  screenshots: [
    { slot: "loading", url: "https://example.com/images/loading.jpg" },
    { slot: "title", url: "https://example.com/images/title.jpg" },
    { slot: "gameplay", url: "https://example.com/images/gameplay.jpg" },
  ],
  sources: [],
  hasRom: true,
  hasQuickstart: false,
  hasContinue: false,
  hasAnySnapshot: false,
};

const EMPTY_GAME: GameDetails = {
  id: "game-empty",
  title: "Empty Game",
  publisher: "Test Publisher",
  year: 1990,
  screenshots: [],
  sources: [],
  hasRom: false,
  hasQuickstart: false,
  hasContinue: false,
  hasAnySnapshot: false,
};

describe("GameMediaSlotsScreen", () => {
  describe("deriveFilename", () => {
    it("returns the last path segment of a URL", () => {
      eq(deriveFilename("https://example.com/images/cover.jpg"), "cover.jpg");
    });

    it("returns slug filename from placehold.co text param", () => {
      eq(
        deriveFilename(
          "https://placehold.co/160x200/1a1a2e/4040ff?text=Bubble+Bobble",
        ),
        "bubble-bobble.png",
      );
    });

    it("returns — for undefined", () => {
      eq(deriveFilename(undefined), "—");
    });

    it("returns — for empty string", () => {
      eq(deriveFilename(""), "—");
    });
  });

  describe("deriveMediaSlots", () => {
    it("returns four slots in fixed order", () => {
      const slots = deriveMediaSlots(FULL_GAME);
      const labels = slots.map((s) => s.label);
      deep(labels, [
        "Cover Thumbnail",
        "Loading Screen",
        "Title Screen",
        "Gameplay Screen",
      ]);
    });

    it("returns correct slot keys", () => {
      const slots = deriveMediaSlots(FULL_GAME);
      const keys = slots.map((s) => s.slot);
      deep(keys, [
        "cover-thumbnail",
        "loading-screen",
        "title-screen",
        "gameplay-screen",
      ]);
    });

    it("returns filenames for assigned slots", () => {
      const slots = deriveMediaSlots(FULL_GAME);
      eq(slots[0]?.filename, "cover.jpg");
      eq(slots[1]?.filename, "loading.jpg");
      eq(slots[2]?.filename, "title.jpg");
      eq(slots[3]?.filename, "gameplay.jpg");
    });

    it("returns — for unassigned slots", () => {
      const slots = deriveMediaSlots(EMPTY_GAME);
      for (const slot of slots) {
        eq(slot.filename, "—");
      }
    });

    it("returns — for cover thumbnail when coverUrl is absent", () => {
      const game: GameDetails = {
        ...FULL_GAME,
        coverUrl: undefined,
      };
      const slots = deriveMediaSlots(game);
      eq(slots[0]?.filename, "—");
    });

    it("returns — for a slot whose screenshot is missing", () => {
      const game: GameDetails = {
        ...FULL_GAME,
        screenshots: [
          { slot: "loading", url: "https://example.com/images/loading.jpg" },
        ],
      };
      const slots = deriveMediaSlots(game);
      eq(slots[2]?.filename, "—");
      eq(slots[3]?.filename, "—");
    });
  });
});
