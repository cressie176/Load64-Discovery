export type MediaFlow = "cover-art" | "screenshots";

export function deriveScreenTitle(
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
