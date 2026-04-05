import type { ImportCandidateState } from "./types";

export const SEED_IMPORT_CANDIDATE: ImportCandidateState = {
  currentIndex: 0,
  queue: [
    {
      id: "cand-1",
      title: "The Last Ninja",
      publisher: "System 3",
      year: 1987,
      roms: [
        { label: "Disk 1", filename: "last-ninja-the-disk1.d64" },
        { label: "Disk 2", filename: "last-ninja-the-disk2.d64" },
      ],
    },
    {
      id: "cand-2",
      title: "Turrican II: The Final Fight",
      publisher: "Rainbow Arts",
      year: 1991,
      roms: [
        { label: "Disk 1", filename: "turrican2-1.d64" },
        { label: "Disk 2", filename: "turrican2-2.d64" },
      ],
    },
    {
      id: "cand-3",
      title: null,
      publisher: null,
      year: null,
      roms: [
        { label: "Disk 1", filename: "unknown-game-1.d64" },
        { label: "Disk 2", filename: "unknown-game-2.d64" },
      ],
    },
    {
      id: "cand-4",
      title: "Wizball",
      publisher: "Ocean",
      year: 1987,
      roms: [{ label: "Disk 1", filename: "wizball.d64" }],
    },
  ],
};
