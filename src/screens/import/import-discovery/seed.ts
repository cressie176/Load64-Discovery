import type { ImportDiscoveryState } from "./types";

export const SEED_IMPORT_DISCOVERY: ImportDiscoveryState = {
  games: 312,
  recognised: 285,
  unrecognised: 27,
  duplicates: 14,
  ignored: 53,
  sample: [
    {
      id: "sug-1",
      title: "The Last Ninja",
      publisher: "System 3",
      year: 1987,
      romCount: 3,
      filenames: ["last-ninja-1.d64", "last-ninja-2.d64", "last-ninja-3.d64"],
    },
    {
      id: "sug-2",
      title: "Turrican",
      publisher: "Rainbow Arts",
      year: 1990,
      romCount: 1,
      filenames: ["turrican.d64"],
    },
    {
      id: "sug-3",
      title: "Wizball",
      publisher: "Ocean",
      year: 1987,
      romCount: 1,
      filenames: ["wizball.d64"],
    },
    {
      id: "sug-4",
      title: null,
      publisher: null,
      year: null,
      romCount: 2,
      filenames: ["game-tape2-a.t64", "game-tape2-b.t64"],
    },
    {
      id: "sug-5",
      title: null,
      publisher: null,
      year: null,
      romCount: 1,
      filenames: ["turrican2.d64"],
    },
  ],
};
