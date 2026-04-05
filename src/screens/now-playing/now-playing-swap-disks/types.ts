export type DiskItem =
  | { kind: "disk"; label: string; filename: string }
  | { kind: "other" };

export type BottomBarStatus =
  | { kind: "current"; diskNumber: number; total: number }
  | { kind: "mounted-disk"; diskNumber: number }
  | { kind: "mounted-file"; filename: string }
  | { kind: "ejected" };

export type ContextMenuAction = "eject";
