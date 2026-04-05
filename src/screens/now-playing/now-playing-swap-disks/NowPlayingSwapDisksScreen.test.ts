import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_NOW_PLAYING } from "../now-playing/seed.ts";
import type { BottomBarStatus } from "./types.ts";

function buildBottomBarText(status: BottomBarStatus): string {
  switch (status.kind) {
    case "current":
      return `Current: Disk ${status.diskNumber} of ${status.total}`;
    case "mounted-disk":
      return `Disk ${status.diskNumber} mounted`;
    case "mounted-file":
      return `${status.filename} mounted`;
    case "ejected":
      return "Disk ejected";
  }
}

function isDiskCurrent(
  filename: string,
  activeDisk: { filename: string } | null,
): boolean {
  return activeDisk !== null && filename === activeDisk.filename;
}

describe("NowPlayingSwapDisksScreen", () => {
  describe("SEED_NOW_PLAYING disks", () => {
    it("has a non-empty disks array", () => {
      eq(Array.isArray(SEED_NOW_PLAYING.disks), true);
      eq(SEED_NOW_PLAYING.disks.length > 0, true);
    });

    it("each disk has a label and filename", () => {
      for (const disk of SEED_NOW_PLAYING.disks) {
        eq(typeof disk.label, "string");
        eq(typeof disk.filename, "string");
        eq(disk.label.length > 0, true);
        eq(disk.filename.length > 0, true);
      }
    });

    it("activeDisk has a filename", () => {
      eq(typeof SEED_NOW_PLAYING.activeDisk?.filename, "string");
    });
  });

  describe("buildBottomBarText", () => {
    it("shows current disk number and total", () => {
      const text = buildBottomBarText({
        kind: "current",
        diskNumber: 1,
        total: 2,
      });
      eq(text, "Current: Disk 1 of 2");
    });

    it("shows mounted disk number", () => {
      const text = buildBottomBarText({ kind: "mounted-disk", diskNumber: 2 });
      eq(text, "Disk 2 mounted");
    });

    it("shows mounted filename", () => {
      const text = buildBottomBarText({
        kind: "mounted-file",
        filename: "savegame.d64",
      });
      eq(text, "savegame.d64 mounted");
    });

    it("shows ejected message", () => {
      const text = buildBottomBarText({ kind: "ejected" });
      eq(text, "Disk ejected");
    });
  });

  describe("isDiskCurrent", () => {
    it("returns true when filename matches activeDisk", () => {
      eq(
        isDiskCurrent("turrican2-1.d64", { filename: "turrican2-1.d64" }),
        true,
      );
    });

    it("returns false when filename does not match", () => {
      eq(
        isDiskCurrent("turrican2-2.d64", { filename: "turrican2-1.d64" }),
        false,
      );
    });

    it("returns false when activeDisk is null", () => {
      eq(isDiskCurrent("turrican2-1.d64", null), false);
    });
  });
});
