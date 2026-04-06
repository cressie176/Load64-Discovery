import type { ProfileDetailState } from "./types";

export const SEED_PROFILE_DETAIL: ProfileDetailState = {
  keyMappings: [
    {
      id: "km-1",
      profileId: "profile-default",
      key: "F1",
      action: "Warp mode",
    },
    {
      id: "km-2",
      profileId: "profile-default",
      key: "F3",
      action: "Snapshot save",
    },
    {
      id: "km-3",
      profileId: "profile-shmups",
      key: "F5",
      action: "Slow motion",
    },
  ],
  envVars: [
    {
      id: "ev-1",
      profileId: "profile-sid-8580",
      name: "SID_FILTER",
      value: "1",
    },
  ],
};
