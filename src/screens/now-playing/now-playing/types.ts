export type NowPlayingAction =
  | "resume"
  | "view-controls"
  | "swap-joystick"
  | "swap-disks"
  | "take-screenshot"
  | "take-snapshot"
  | "quit-game";

export interface JoystickPorts {
  port1ControllerId: string;
  port1DeviceName: string;
  port2ControllerId: string;
  port2DeviceName: string;
}

export interface Disk {
  label: string;
  filename: string;
}

export interface ActiveDisk {
  label: string;
  filename: string;
}

export interface NowPlayingState {
  gameId: string;
  gameTitle: string;
  joystickPorts: JoystickPorts;
  disks: Disk[];
  activeDisk: ActiveDisk | null;
  gameplayScreenshotUrl: string | null;
}
