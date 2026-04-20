import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_NOW_PLAYING } from "../now-playing/seed.ts";
import type { JoystickPorts } from "../now-playing/types.ts";

function swapPorts(ports: JoystickPorts): JoystickPorts {
  return {
    port1ControllerId: ports.port2ControllerId,
    port1DeviceName: ports.port2DeviceName,
    port2ControllerId: ports.port1ControllerId,
    port2DeviceName: ports.port1DeviceName,
  };
}

describe("NowPlayingSwapJoystickPortsScreen", () => {
  describe("SEED_NOW_PLAYING joystick ports", () => {
    it("has port1 and port2 device names", () => {
      eq(typeof SEED_NOW_PLAYING.joystickPorts.port1DeviceName, "string");
      eq(typeof SEED_NOW_PLAYING.joystickPorts.port2DeviceName, "string");
      eq(SEED_NOW_PLAYING.joystickPorts.port1DeviceName.length > 0, true);
      eq(SEED_NOW_PLAYING.joystickPorts.port2DeviceName.length > 0, true);
    });

    it("has port1 and port2 controller IDs", () => {
      eq(typeof SEED_NOW_PLAYING.joystickPorts.port1ControllerId, "string");
      eq(typeof SEED_NOW_PLAYING.joystickPorts.port2ControllerId, "string");
    });
  });

  describe("swapPorts", () => {
    it("swaps device names between ports", () => {
      const ports = SEED_NOW_PLAYING.joystickPorts;
      const swapped = swapPorts(ports);
      eq(swapped.port1DeviceName, ports.port2DeviceName);
      eq(swapped.port2DeviceName, ports.port1DeviceName);
    });

    it("swaps controller IDs between ports", () => {
      const ports = SEED_NOW_PLAYING.joystickPorts;
      const swapped = swapPorts(ports);
      eq(swapped.port1ControllerId, ports.port2ControllerId);
      eq(swapped.port2ControllerId, ports.port1ControllerId);
    });

    it("is reversible — swapping twice returns original state", () => {
      const ports = SEED_NOW_PLAYING.joystickPorts;
      const swappedTwice = swapPorts(swapPorts(ports));
      eq(swappedTwice.port1ControllerId, ports.port1ControllerId);
      eq(swappedTwice.port1DeviceName, ports.port1DeviceName);
      eq(swappedTwice.port2ControllerId, ports.port2ControllerId);
      eq(swappedTwice.port2DeviceName, ports.port2DeviceName);
    });

    it("does not mutate the original ports object", () => {
      const ports = { ...SEED_NOW_PLAYING.joystickPorts };
      const originalPort1DeviceName = ports.port1DeviceName;
      swapPorts(ports);
      eq(ports.port1DeviceName, originalPort1DeviceName);
    });
  });
});
