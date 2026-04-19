import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFormFields, deriveScreenTitle } from "./utils.ts";

describe("GameDetailsEditScreen", () => {
  describe("deriveScreenTitle", () => {
    it("returns simple edit breadcrumb", () => {
      eq(
        deriveScreenTitle(false, "Bubble Bobble", null),
        "Bubble Bobble > Details",
      );
    });

    it("returns import breadcrumb before fetch", () => {
      eq(
        deriveScreenTitle(true, "Bubble Bobble", null),
        "Import Games > Bubble Bobble > Details",
      );
    });

    it("uses importTitle when provided", () => {
      eq(
        deriveScreenTitle(true, "Bubble Bobble", null, "BB disc1"),
        "Import Games > BB disc1 > Details",
      );
    });

    it("appends fetch source in import mode after fetch", () => {
      eq(
        deriveScreenTitle(true, "Bubble Bobble", "GameBase64: 243"),
        "Import Games > Bubble Bobble > Details > GameBase64: 243",
      );
    });

    it("appends fetch source in simple mode after fetch", () => {
      eq(
        deriveScreenTitle(false, "Elite", "GameBase64: 881"),
        "Elite > Details > GameBase64: 881",
      );
    });
  });

  describe("buildFormFields", () => {
    it("includes only base fields when no imported values", () => {
      const fields = buildFormFields({}, false);
      eq(
        fields.join(","),
        "title,publisher,year,colourEncoding,trueDriveEmulation,notes,fetch,save,cancel",
      );
    });

    it("inserts apply-title after title when title is imported", () => {
      const fields = buildFormFields({ title: "Last Ninja, The" }, false);
      eq(fields[0], "title");
      eq(fields[1], "apply-title");
      eq(fields[2], "publisher");
    });

    it("inserts apply-title after title when imported title is empty string", () => {
      const fields = buildFormFields({ title: "" }, false);
      eq(fields[0], "title");
      eq(fields[1], "apply-title");
      eq(fields[2], "publisher");
    });

    it("does not insert apply-title when title is undefined", () => {
      const fields = buildFormFields({ publisher: "System 3" }, false);
      eq(fields[0], "title");
      eq(fields[1], "publisher");
      eq(fields[2], "apply-publisher");
    });

    it("inserts apply-publisher after publisher when publisher is imported", () => {
      const fields = buildFormFields({ publisher: "System 3" }, false);
      const idx = fields.indexOf("publisher");
      eq(fields[idx + 1], "apply-publisher");
    });

    it("inserts apply-year after year when year is imported", () => {
      const fields = buildFormFields({ year: "1987" }, false);
      const idx = fields.indexOf("year");
      eq(fields[idx + 1], "apply-year");
    });

    it("inserts apply-notes after notes when notes is imported", () => {
      const fields = buildFormFields({ notes: "Classic arcade game" }, false);
      const idx = fields.indexOf("notes");
      eq(fields[idx + 1], "apply-notes");
    });

    it("inserts all apply buttons when all fields are imported", () => {
      const fields = buildFormFields(
        { title: "T", publisher: "P", year: "1987", notes: "N" },
        false,
      );
      eq(
        fields.join(","),
        "title,apply-title,publisher,apply-publisher,year,apply-year,colourEncoding,trueDriveEmulation,notes,apply-notes,fetch,save,cancel",
      );
    });

    it("omits save and cancel in import mode", () => {
      const fields = buildFormFields({}, true);
      eq(fields.includes("save"), false);
      eq(fields.includes("cancel"), false);
      eq(fields.includes("fetch"), true);
    });
  });
});
