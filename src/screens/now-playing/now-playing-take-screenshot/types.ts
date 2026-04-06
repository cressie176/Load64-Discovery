export type ScreenMode = "capture" | "review";

export type OverlayOption = "overwrite" | "rename" | "discard";

export type BottomBarStatus =
  | { kind: "idle" }
  | { kind: "saved"; filename: string }
  | { kind: "error"; reason: string };

export interface ConflictState {
  filename: string;
  focusedOption: OverlayOption;
}

export interface MediaSlots {
  loading: boolean;
  title: boolean;
  gameplay: boolean;
}
