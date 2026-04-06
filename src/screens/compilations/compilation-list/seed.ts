import type { CompilationsState } from "./types";

export const SEED_COMPILATIONS: CompilationsState = {
  compilations: [
    { id: "compilation-all-games", name: "All Games", kind: "all-games" },
    {
      id: "compilation-favourites",
      name: "Favourites",
      kind: "user-defined",
    },
    {
      id: "compilation-multiplayer",
      name: "Multiplayer",
      kind: "user-defined",
    },
    {
      id: "compilation-platform",
      name: "Platform Games",
      kind: "user-defined",
    },
    {
      id: "compilation-shooters",
      name: "Shoot-em-ups",
      kind: "user-defined",
    },
    {
      id: "compilation-sports",
      name: "Sports",
      kind: "user-defined",
    },
  ],
  compilationGameRefs: [
    {
      compilationId: "compilation-favourites",
      gameId: "game-monty",
    },
    {
      compilationId: "compilation-favourites",
      gameId: "game-iridis",
    },
    {
      compilationId: "compilation-favourites",
      gameId: "game-elite",
    },
    {
      compilationId: "compilation-multiplayer",
      gameId: "game-summer",
    },
    {
      compilationId: "compilation-multiplayer",
      gameId: "game-bubble",
    },
    {
      compilationId: "compilation-platform",
      gameId: "game-monty",
    },
    {
      compilationId: "compilation-platform",
      gameId: "game-zzap",
    },
    {
      compilationId: "compilation-shooters",
      gameId: "game-iridis",
    },
  ],
};
