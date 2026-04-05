export type BinaryStatus = "valid" | "invalid" | "unconfigured";

export type BinaryStatusReason =
  | "Binary not found"
  | "Binary is not executable";

export interface Binary {
  machineName: string;
  path: string | null;
  status: BinaryStatus;
  statusReason: BinaryStatusReason | null;
}

export type BinaryList = Binary[];
