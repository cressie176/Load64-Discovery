import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";

const HOST_KEYS = [
  "Esc",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "Tab",
  "Caps Lock",
  "Left Shift",
  "Right Shift",
  "Left Ctrl",
  "Backspace",
  "Home",
  "Page Up",
  "Delete",
  "Up Arrow",
  "Down Arrow",
  "Left Arrow",
  "Right Arrow",
  "Space",
  "Enter",
];

const MACHINE_KEYS = [
  "RUN/STOP",
  "RESTORE",
  "CTRL",
  "C=",
  "SPACE",
  "RETURN",
  "DEL",
  "CLR/HOME",
  "Left Shift",
  "Right Shift",
  "Shift Lock",
  "CRSR UP",
  "CRSR DOWN",
  "CRSR LEFT",
  "CRSR RIGHT",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
];

function validateForm(hostKey: string, machineKey: string): string | null {
  if (!hostKey) return "Host Key is required.";
  if (!machineKey) return "Machine Key is required.";
  return null;
}

describe("KeyMappingEditScreen", () => {
  describe("validateForm", () => {
    it("returns error when host key is empty", () => {
      eq(validateForm("", "RUN/STOP"), "Host Key is required.");
    });

    it("returns error when machine key is empty", () => {
      eq(validateForm("Esc", ""), "Machine Key is required.");
    });

    it("returns null when both fields are set", () => {
      eq(validateForm("Esc", "RUN/STOP"), null);
    });
  });

  describe("HOST_KEYS", () => {
    it("includes Esc", () => {
      eq(HOST_KEYS.includes("Esc"), true);
    });

    it("includes Left Arrow", () => {
      eq(HOST_KEYS.includes("Left Arrow"), true);
    });

    it("includes F1", () => {
      eq(HOST_KEYS.includes("F1"), true);
    });
  });

  describe("MACHINE_KEYS", () => {
    it("includes RUN/STOP", () => {
      eq(MACHINE_KEYS.includes("RUN/STOP"), true);
    });

    it("includes CRSR LEFT", () => {
      eq(MACHINE_KEYS.includes("CRSR LEFT"), true);
    });

    it("includes C=", () => {
      eq(MACHINE_KEYS.includes("C="), true);
    });
  });
});
