import type { NowPlayingState } from "./types";

export const SEED_NOW_PLAYING: NowPlayingState = {
  gameId: "game-bubble",
  gameTitle: "Bubble Bobble",
  joystickPorts: {
    port1DeviceName: "Logitech Dual Action",
    port2DeviceName: "Xbox Wireless Controller",
  },
  activeDisk: {
    label: "Disk 1",
  },
  gameplayScreenshotUrl:
    "https://placehold.co/320x240/0d0d0d/4040ff?text=Gameplay",
};
