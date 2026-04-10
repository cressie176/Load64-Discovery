import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import type { GameRom } from "./types";
import { renumber } from "./utils.ts";

describe("renumber", () => {
  it("assigns sequential positions starting from 1", () => {
    const roms: GameRom[] = [
      { id: "a", position: 99, label: "Disk 1", filename: "a.d64" },
      { id: "b", position: 99, label: "Disk 2", filename: "b.d64" },
      { id: "c", position: 99, label: "Disk 3", filename: "c.d64" },
    ];
    const result = renumber(roms);
    eq(result[0].position, 1);
    eq(result[1].position, 2);
    eq(result[2].position, 3);
  });

  it("preserves all other fields", () => {
    const roms: GameRom[] = [
      { id: "a", position: 5, label: "Side A", filename: "game.d64" },
    ];
    const result = renumber(roms);
    eq(result[0].id, "a");
    eq(result[0].label, "Side A");
    eq(result[0].filename, "game.d64");
  });

  it("returns empty array unchanged", () => {
    eq(renumber([]).length, 0);
  });
});
