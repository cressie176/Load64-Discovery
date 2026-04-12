import type { MediaFlow } from "../get-from-file/media";

export function deriveScreenTitle(
  flow: MediaFlow,
  importMode: boolean,
  gameTitle: string,
  importTitle?: string,
): string {
  const label = importTitle ?? gameTitle;
  const prefix = importMode ? `Import Games > ${label}` : label;
  if (flow === "cover-art") {
    return `${prefix} > Media > Cover Art > From URL`;
  }
  return `${prefix} > Media > Screenshots > From URL`;
}
