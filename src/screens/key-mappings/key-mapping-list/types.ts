export interface KeyMapping {
  id: string;
  ownerId: string;
  hostKey: string;
  machineKey: string;
}

export interface KeyMappingOwner {
  id: string;
  name: string;
  type: "profile" | "launch-config";
  profileIds: string[];
}

export interface KeyMappingsState {
  owners: KeyMappingOwner[];
  mappings: KeyMapping[];
}

export interface KeyMappingRow {
  id: string;
  hostKey: string;
  machineKey: string;
  sourceLabel: string;
  isInherited: boolean;
  ownerId: string;
}
