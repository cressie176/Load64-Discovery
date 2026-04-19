type ImportableField = "title" | "publisher" | "year" | "notes";
type FormField =
  | "title"
  | "apply-title"
  | "publisher"
  | "apply-publisher"
  | "year"
  | "apply-year"
  | "colourEncoding"
  | "trueDriveEmulation"
  | "notes"
  | "apply-notes"
  | "fetch"
  | "save"
  | "cancel";

export function deriveScreenTitle(
  importMode: boolean,
  gameTitle: string,
  fetchSource: string | null,
  importTitle?: string,
): string {
  const label = importTitle ?? gameTitle;
  if (importMode) {
    if (fetchSource) {
      return `Import Games > ${label} > Details > ${fetchSource}`;
    }
    return `Import Games > ${label} > Details`;
  }
  if (fetchSource) {
    return `${label} > Details > ${fetchSource}`;
  }
  return `${label} > Details`;
}

export function buildFormFields(
  importedValues: Partial<Record<ImportableField, string>>,
  importMode: boolean,
): FormField[] {
  const fields: FormField[] = ["title"];
  if (importedValues.title !== undefined) fields.push("apply-title");
  fields.push("publisher");
  if (importedValues.publisher !== undefined) fields.push("apply-publisher");
  fields.push("year");
  if (importedValues.year !== undefined) fields.push("apply-year");
  fields.push("colourEncoding", "trueDriveEmulation", "notes");
  if (importedValues.notes !== undefined) fields.push("apply-notes");
  fields.push("fetch");
  if (!importMode) fields.push("save", "cancel");
  return fields;
}
