export interface Snapshot {
  id: string;
  groupName: string;
  timestamp: Date;
  thumbnailUrl?: string;
}

export interface SnapshotGroup {
  name: string;
  snapshots: Snapshot[];
}

export interface SnapshotsState {
  snapshots: Record<string, Snapshot[]>;
}

export type SnapshotListMode = "launch" | "manage";
