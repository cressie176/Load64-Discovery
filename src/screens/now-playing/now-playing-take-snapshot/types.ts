export type ScreenMode = "capture" | "review";

export type OverlayOption = "overwrite" | "rename" | "discard";

export interface ConflictState {
  filename: string;
  focusedOption: OverlayOption;
}
