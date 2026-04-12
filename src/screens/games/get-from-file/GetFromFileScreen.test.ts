import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";

type MediaFlow = "cover-art" | "screenshots";

function deriveScreenTitle(
  flow: MediaFlow,
  importMode: boolean,
  gameTitle: string,
  importTitle?: string,
): string {
  const label = importTitle ?? gameTitle;
  const prefix = importMode ? `Import Games > ${label}` : label;
  if (flow === "cover-art") {
    return `${prefix} > Media > Cover Art > From File`;
  }
  return `${prefix} > Media > Screenshots > From File`;
}

describe("GetFromFileScreen", () => {
  describe("deriveScreenTitle", () => {
    describe("cover-art flow", () => {
      it("returns standard breadcrumb", () => {
        eq(
          deriveScreenTitle("cover-art", false, "Bubble Bobble"),
          "Bubble Bobble > Media > Cover Art > From File",
        );
      });

      it("returns import breadcrumb", () => {
        eq(
          deriveScreenTitle("cover-art", true, "Bubble Bobble"),
          "Import Games > Bubble Bobble > Media > Cover Art > From File",
        );
      });

      it("uses importTitle when provided", () => {
        eq(
          deriveScreenTitle("cover-art", true, "Bubble Bobble", "BB disc1"),
          "Import Games > BB disc1 > Media > Cover Art > From File",
        );
      });
    });

    describe("screenshots flow", () => {
      it("returns standard breadcrumb", () => {
        eq(
          deriveScreenTitle("screenshots", false, "Out Run"),
          "Out Run > Media > Screenshots > From File",
        );
      });

      it("returns import breadcrumb", () => {
        eq(
          deriveScreenTitle("screenshots", true, "Out Run", "Out Run disc1"),
          "Import Games > Out Run disc1 > Media > Screenshots > From File",
        );
      });
    });

    it("covers all flow values without type error", () => {
      const flows: MediaFlow[] = ["cover-art", "screenshots"];
      for (const flow of flows) {
        const result = deriveScreenTitle(flow, false, "Test Game");
        eq(typeof result, "string");
      }
    });
  });
});
