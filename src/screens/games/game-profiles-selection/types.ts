export type GameProfilesSelectionRow =
  | { kind: "profile"; id: string; name: string }
  | { kind: "section-heading"; label: string }
  | { kind: "default-profile"; defaultProfileName: string };
