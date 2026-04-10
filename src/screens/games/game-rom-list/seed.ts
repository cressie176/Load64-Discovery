import type { GameRomListState } from "./types";

export const SEED_GAME_ROM_LIST: GameRomListState = {
  roms: {
    "game-bubble": [
      {
        id: "rom-bubble-1",
        position: 1,
        label: "Disk 1",
        filename: "bubble-bobble-disk1.d64",
      },
      {
        id: "rom-bubble-2",
        position: 2,
        label: "Disk 2",
        filename: "bubble-bobble-disk2.d64",
      },
    ],
    "game-elite": [
      {
        id: "rom-elite-1",
        position: 1,
        label: "Disk 1",
        filename: "elite.d64",
      },
    ],
    "game-turrican": [
      {
        id: "rom-turrican-1",
        position: 1,
        label: "Side A",
        filename: "turrican-ii-side-a.d64",
      },
      {
        id: "rom-turrican-2",
        position: 2,
        label: "Side B",
        filename: "turrican-ii-side-b.d64",
      },
      {
        id: "rom-turrican-3",
        position: 3,
        label: "Side C",
        filename: "turrican-ii-side-c.d64",
      },
    ],
  },
};
