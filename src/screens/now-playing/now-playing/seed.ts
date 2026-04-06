import type { NowPlayingState } from "./types";

export const SEED_NOW_PLAYING: NowPlayingState = {
  gameId: "game-turrican",
  gameTitle: "Turrican II",
  joystickPorts: {
    port1ControllerId: "ctrl-logitech-dual-action",
    port1DeviceName: "Logitech Dual Action",
    port2ControllerId: "ctrl-xbox-wireless",
    port2DeviceName: "Xbox Wireless Controller",
  },
  disks: [
    { label: "Disk 1", filename: "turrican2-1.d64" },
    { label: "Disk 2", filename: "turrican2-2.d64" },
  ],
  activeDisk: {
    label: "Disk 1",
    filename: "turrican2-1.d64",
  },
  gameplayScreenshotUrl:
    "https://placehold.co/320x240/0d0d0d/4040ff?text=Gameplay",
};
