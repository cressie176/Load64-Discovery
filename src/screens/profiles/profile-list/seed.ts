import type { ProfilesState } from "./types";

export const SEED_PROFILES: ProfilesState = {
  profiles: [
    { id: "profile-default", name: "Fast Load", isDefault: true },
    { id: "profile-multiplayer", name: "Multiplayer", isDefault: false },
    { id: "profile-sid-8580", name: "SID 8580", isDefault: false },
    { id: "profile-shmups", name: "Shmups", isDefault: false },
  ],
  gameProfileRefs: [
    { gameId: "game-monty", profileId: "profile-multiplayer", order: 1 },
    { gameId: "game-monty", profileId: "profile-sid-8580", order: 2 },
    { gameId: "game-iridis", profileId: "profile-shmups", order: 1 },
  ],
};
