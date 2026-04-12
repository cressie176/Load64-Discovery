import { deepEqual as deq, equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import type { Snapshot, SnapshotGroup } from "./types.ts";
import { buildContextMenuItems } from "./utils.ts";

function groupsFromSnapshots(snapshots: Snapshot[]): SnapshotGroup[] {
  const map = new Map<string, Snapshot[]>();
  for (const snap of snapshots) {
    const list = map.get(snap.groupName) ?? [];
    list.push(snap);
    map.set(snap.groupName, list);
  }
  return Array.from(map.entries()).map(([name, snaps]) => ({
    name,
    snapshots: [...snaps].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    ),
  }));
}

function sortGroups(groupNames: string[]): string[] {
  const hasQuickstart = groupNames.includes("quickstart");
  const rest = groupNames
    .filter((n) => n !== "quickstart")
    .sort((a, b) => a.localeCompare(b));
  return hasQuickstart ? ["quickstart", ...rest] : rest;
}

function formatTimestamp(date: Date): string {
  return `${date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

describe("SnapshotListScreen", () => {
  describe("groupsFromSnapshots", () => {
    it("returns empty array for empty snapshot list", () => {
      const groups = groupsFromSnapshots([]);
      eq(groups.length, 0);
    });

    it("groups snapshots by groupName", () => {
      const snapshots: Snapshot[] = [
        {
          id: "a",
          groupName: "knight",
          timestamp: new Date("2026-01-01"),
        },
        {
          id: "b",
          groupName: "knight",
          timestamp: new Date("2026-01-02"),
        },
        {
          id: "c",
          groupName: "serf",
          timestamp: new Date("2026-01-03"),
        },
      ];
      const groups = groupsFromSnapshots(snapshots);
      eq(groups.length, 2);
      eq(
        groups.some((g) => g.name === "knight" && g.snapshots.length === 2),
        true,
      );
      eq(
        groups.some((g) => g.name === "serf" && g.snapshots.length === 1),
        true,
      );
    });

    it("sorts snapshots within a group newest first", () => {
      const snapshots: Snapshot[] = [
        { id: "a", groupName: "knight", timestamp: new Date("2026-01-01") },
        { id: "b", groupName: "knight", timestamp: new Date("2026-01-03") },
        { id: "c", groupName: "knight", timestamp: new Date("2026-01-02") },
      ];
      const groups = groupsFromSnapshots(snapshots);
      const knight = groups.find((g) => g.name === "knight");
      eq(knight?.snapshots[0].id, "b");
      eq(knight?.snapshots[1].id, "c");
      eq(knight?.snapshots[2].id, "a");
    });
  });

  describe("sortGroups", () => {
    it("pins quickstart first", () => {
      const groups = sortGroups(["serf", "quickstart", "knight"]);
      eq(groups[0], "quickstart");
    });

    it("sorts remaining groups alphabetically after quickstart", () => {
      const groups = sortGroups(["wizard", "quickstart", "knight", "serf"]);
      deq(groups, ["quickstart", "knight", "serf", "wizard"]);
    });

    it("returns alphabetical order when no quickstart", () => {
      const groups = sortGroups(["wizard", "knight", "serf"]);
      deq(groups, ["knight", "serf", "wizard"]);
    });

    it("handles single group", () => {
      deq(sortGroups(["knight"]), ["knight"]);
    });

    it("handles empty array", () => {
      deq(sortGroups([]), []);
    });
  });

  describe("buildContextMenuItems", () => {
    it("always includes Delete", () => {
      const items = buildContextMenuItems(1, 0);
      eq(items.includes("Delete"), true);
    });

    it("omits Delete Others when group has only one snapshot", () => {
      const items = buildContextMenuItems(1, 0);
      eq(items.includes("Delete Others"), false);
    });

    it("includes Delete Others when group has two or more snapshots", () => {
      const items = buildContextMenuItems(2, 0);
      eq(items.includes("Delete Others"), true);
    });

    it("omits Delete Subsequent when focused snapshot is the last in the group", () => {
      const items = buildContextMenuItems(3, 2);
      eq(items.includes("Delete Subsequent"), false);
    });

    it("includes Delete Subsequent when there are older snapshots below", () => {
      const items = buildContextMenuItems(3, 1);
      eq(items.includes("Delete Subsequent"), true);
    });

    it("includes both Delete Others and Delete Subsequent when applicable", () => {
      const items = buildContextMenuItems(3, 0);
      deq(items, ["Delete", "Delete Others", "Delete Subsequent"]);
    });
  });

  describe("formatTimestamp", () => {
    it("formats a date as a readable string with date and time", () => {
      const date = new Date("2026-03-29T14:32:00");
      const formatted = formatTimestamp(date);
      eq(typeof formatted, "string");
      eq(formatted.length > 0, true);
    });

    it("includes the year in the formatted string", () => {
      const date = new Date("2026-03-29T14:32:00");
      const formatted = formatTimestamp(date);
      eq(formatted.includes("2026"), true);
    });
  });
});
