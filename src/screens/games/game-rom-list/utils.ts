import type { GameRom } from "./types";

export function renumber(roms: GameRom[]): GameRom[] {
  return roms.map((rom, i) => ({ ...rom, position: i + 1 }));
}

export function wrapIndex(
  index: number,
  delta: number,
  length: number,
): number {
  return (index + delta + length) % length;
}
