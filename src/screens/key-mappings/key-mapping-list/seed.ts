import type { KeyMappingsState } from "./types";

export const SEED_KEY_MAPPINGS: KeyMappingsState = {
  owners: [
    {
      id: "profile-default",
      name: "Fast Load",
      type: "profile",
      profileIds: [],
    },
    {
      id: "profile-multiplayer",
      name: "Multiplayer",
      type: "profile",
      profileIds: ["profile-default"],
    },
    {
      id: "profile-sid-8580",
      name: "SID 8580",
      type: "profile",
      profileIds: [],
    },
    {
      id: "profile-shmups",
      name: "Shmups",
      type: "profile",
      profileIds: ["profile-default"],
    },
    {
      id: "launch-config-monty",
      name: "Monty on the Run",
      type: "launch-config",
      profileIds: ["profile-default", "profile-sid-8580"],
    },
  ],
  mappings: [
    {
      id: "km-1",
      ownerId: "profile-default",
      hostKey: "Esc",
      machineKey: "RUN/STOP",
    },
    {
      id: "km-2",
      ownerId: "profile-default",
      hostKey: "Left Arrow",
      machineKey: "CRSR LEFT",
    },
    {
      id: "km-3",
      ownerId: "profile-default",
      hostKey: "Right Arrow",
      machineKey: "CRSR RIGHT",
    },
    {
      id: "km-4",
      ownerId: "profile-sid-8580",
      hostKey: "F1",
      machineKey: "F1",
    },
    {
      id: "km-5",
      ownerId: "launch-config-monty",
      hostKey: "F5",
      machineKey: "F5",
    },
  ],
};
