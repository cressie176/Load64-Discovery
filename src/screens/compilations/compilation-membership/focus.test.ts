import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import type { FocusState } from "./focus.ts";
import { nextFocusState } from "./focus.ts";

describe("nextFocusState", () => {
  describe("Tab forward from list", () => {
    it("moves to save", () => {
      const state: FocusState = { region: "list", action: "save" };
      const next = nextFocusState(state, false);
      eq(next.region, "actions");
      eq(next.action, "save");
    });
  });

  describe("Tab forward from save", () => {
    it("moves to cancel", () => {
      const state: FocusState = { region: "actions", action: "save" };
      const next = nextFocusState(state, false);
      eq(next.region, "actions");
      eq(next.action, "cancel");
    });
  });

  describe("Tab forward from cancel", () => {
    it("wraps back to list", () => {
      const state: FocusState = { region: "actions", action: "cancel" };
      const next = nextFocusState(state, false);
      eq(next.region, "list");
    });
  });

  describe("Shift+Tab from list", () => {
    it("moves to cancel", () => {
      const state: FocusState = { region: "list", action: "save" };
      const next = nextFocusState(state, true);
      eq(next.region, "actions");
      eq(next.action, "cancel");
    });
  });

  describe("Shift+Tab from cancel", () => {
    it("moves to save", () => {
      const state: FocusState = { region: "actions", action: "cancel" };
      const next = nextFocusState(state, true);
      eq(next.region, "actions");
      eq(next.action, "save");
    });
  });

  describe("Shift+Tab from save", () => {
    it("wraps back to list", () => {
      const state: FocusState = { region: "actions", action: "save" };
      const next = nextFocusState(state, true);
      eq(next.region, "list");
    });
  });
});
