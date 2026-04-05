export interface ViceArgument {
  id: string;
  ownerId: string;
  name: string;
  value: string;
}

export interface ViceArgumentOwner {
  id: string;
  name: string;
  type: "profile" | "launch-config";
  profileIds: string[];
}

export interface ViceArgumentsState {
  owners: ViceArgumentOwner[];
  arguments: ViceArgument[];
}

export interface ViceArgumentRow {
  id: string;
  name: string;
  value: string;
  sourceLabel: string;
  isInherited: boolean;
  ownerId: string;
}
