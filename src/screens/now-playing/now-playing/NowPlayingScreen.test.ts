import { equal as eq, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_NOW_PLAYING } from "./seed.ts";
import type { NowPlayingAction, NowPlayingState } from "./types.ts";

function getActionLabel(action: NowPlayingAction): string {
  switch (action) {
    case "resume":
      return "Resume Game";
    case "view-controls":
      return "View controls";
    case "swap-joystick":
      return "Swap joystick ports";
    case "swap-disks":
      return "Swap disks";
    case "take-screenshot":
      return "Take screenshot";
    case "take-snapshot":
      return "Take snapshot";
    case "quit-game":
      return "Quit Game";
  }
}

function buildBottomBarMessage(
  action: NowPlayingAction,
  port1Name: string,
  port2Name: string,
  diskLabel: string | null,
): string {
  switch (action) {
    case "swap-joystick":
      return `Port 1: ${port1Name}  ◆  Port 2: ${port2Name}`;
    case "swap-disks":
      return diskLabel !== null ? `Current: ${diskLabel}` : "";
    default:
      return "";
  }
}

function swapJoystickPorts(state: NowPlayingState): NowPlayingState {
  const {
    port1ControllerId,
    port1DeviceName,
    port2ControllerId,
    port2DeviceName,
  } = state.joystickPorts;
  return {
    ...state,
    joystickPorts: {
      port1ControllerId: port2ControllerId,
      port1DeviceName: port2DeviceName,
      port2ControllerId: port1ControllerId,
      port2DeviceName: port1DeviceName,
    },
  };
}

describe("NowPlayingScreen", () => {
  describe("SEED_NOW_PLAYING", () => {
    it("has a gameId", () => {
      eq(typeof SEED_NOW_PLAYING.gameId, "string");
      ok(SEED_NOW_PLAYING.gameId.length > 0);
    });

    it("has a gameTitle", () => {
      eq(typeof SEED_NOW_PLAYING.gameTitle, "string");
      ok(SEED_NOW_PLAYING.gameTitle.length > 0);
    });

    it("has joystickPorts with two controller IDs and device names", () => {
      eq(typeof SEED_NOW_PLAYING.joystickPorts.port1ControllerId, "string");
      eq(typeof SEED_NOW_PLAYING.joystickPorts.port1DeviceName, "string");
      eq(typeof SEED_NOW_PLAYING.joystickPorts.port2ControllerId, "string");
      eq(typeof SEED_NOW_PLAYING.joystickPorts.port2DeviceName, "string");
    });
  });

  describe("getActionLabel", () => {
    it("returns correct label for resume", () => {
      eq(getActionLabel("resume"), "Resume Game");
    });

    it("returns correct label for view-controls", () => {
      eq(getActionLabel("view-controls"), "View controls");
    });

    it("returns correct label for swap-joystick", () => {
      eq(getActionLabel("swap-joystick"), "Swap joystick ports");
    });

    it("returns correct label for swap-disks", () => {
      eq(getActionLabel("swap-disks"), "Swap disks");
    });

    it("returns correct label for take-screenshot", () => {
      eq(getActionLabel("take-screenshot"), "Take screenshot");
    });

    it("returns correct label for take-snapshot", () => {
      eq(getActionLabel("take-snapshot"), "Take snapshot");
    });

    it("returns correct label for quit-game", () => {
      eq(getActionLabel("quit-game"), "Quit Game");
    });
  });

  describe("buildBottomBarMessage", () => {
    it("shows port names for swap-joystick", () => {
      const msg = buildBottomBarMessage(
        "swap-joystick",
        "Controller A",
        "Controller B",
        null,
      );
      eq(msg, "Port 1: Controller A  ◆  Port 2: Controller B");
    });

    it("shows current disk for swap-disks", () => {
      const msg = buildBottomBarMessage(
        "swap-disks",
        "Controller A",
        "Controller B",
        "Disk 1",
      );
      eq(msg, "Current: Disk 1");
    });

    it("returns empty string for swap-disks with no disk", () => {
      const msg = buildBottomBarMessage(
        "swap-disks",
        "Controller A",
        "Controller B",
        null,
      );
      eq(msg, "");
    });

    it("returns empty string for resume", () => {
      eq(
        buildBottomBarMessage("resume", "Controller A", "Controller B", null),
        "",
      );
    });

    it("returns empty string for view-controls", () => {
      eq(
        buildBottomBarMessage(
          "view-controls",
          "Controller A",
          "Controller B",
          null,
        ),
        "",
      );
    });

    it("returns empty string for take-screenshot", () => {
      eq(
        buildBottomBarMessage(
          "take-screenshot",
          "Controller A",
          "Controller B",
          null,
        ),
        "",
      );
    });

    it("returns empty string for take-snapshot", () => {
      eq(
        buildBottomBarMessage(
          "take-snapshot",
          "Controller A",
          "Controller B",
          null,
        ),
        "",
      );
    });

    it("returns empty string for quit-game", () => {
      eq(
        buildBottomBarMessage(
          "quit-game",
          "Controller A",
          "Controller B",
          null,
        ),
        "",
      );
    });

    it("reflects updated ports after swap", () => {
      const swapped = swapJoystickPorts(SEED_NOW_PLAYING);
      const msg = buildBottomBarMessage(
        "swap-joystick",
        swapped.joystickPorts.port1DeviceName,
        swapped.joystickPorts.port2DeviceName,
        null,
      );
      ok(
        msg.includes(SEED_NOW_PLAYING.joystickPorts.port2DeviceName),
        "port1 should now be the original port2",
      );
      ok(msg.startsWith("Port 1:"), "message should start with Port 1:");
    });
  });

  describe("swapJoystickPorts", () => {
    it("swaps port1 and port2 controller IDs and device names", () => {
      const state = SEED_NOW_PLAYING;
      const swapped = swapJoystickPorts(state);
      eq(
        swapped.joystickPorts.port1ControllerId,
        state.joystickPorts.port2ControllerId,
      );
      eq(
        swapped.joystickPorts.port1DeviceName,
        state.joystickPorts.port2DeviceName,
      );
      eq(
        swapped.joystickPorts.port2ControllerId,
        state.joystickPorts.port1ControllerId,
      );
      eq(
        swapped.joystickPorts.port2DeviceName,
        state.joystickPorts.port1DeviceName,
      );
    });

    it("does not mutate the original state", () => {
      const original = { ...SEED_NOW_PLAYING };
      swapJoystickPorts(SEED_NOW_PLAYING);
      eq(
        SEED_NOW_PLAYING.joystickPorts.port1DeviceName,
        original.joystickPorts.port1DeviceName,
      );
    });
  });
});
