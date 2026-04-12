import type { ScreenName } from "../../../types/router";

type ItemWithScreen = {
  label: string;
  screen: ScreenName;
  action?: never;
  deleteAction?: never;
};

type ItemWithAction = {
  label: string;
  screen?: never;
  action: "delete-game";
  deleteAction?: never;
};

export type GameManagementItem = ItemWithScreen | ItemWithAction;

export type GameManagementRow =
  | { kind: "group-header"; label: string; danger?: true }
  | { kind: "item"; item: GameManagementItem };

const GAME_ITEMS: readonly GameManagementItem[] = [
  { label: "Details", screen: "game-details-edit" as ScreenName },
  {
    label: "Catalogues",
    screen: "game-catalogue-links" as ScreenName,
  },
  { label: "ROMs", screen: "game-rom-list" as ScreenName },
  { label: "Snapshots", screen: "snapshot-list" as ScreenName },
];

const MEDIA_ITEMS: readonly GameManagementItem[] = [
  { label: "Cover Art", screen: "game-cover-art" as ScreenName },
  { label: "Screenshots", screen: "game-screenshots" as ScreenName },
];

const CONFIGURATION_ITEMS: readonly GameManagementItem[] = [
  { label: "Controls", screen: "game-control-list" as ScreenName },
  { label: "Profiles", screen: "game-profiles-selection" as ScreenName },
  { label: "VICE Arguments", screen: "vice-argument-list" as ScreenName },
  { label: "Key Mappings", screen: "key-mapping-list" as ScreenName },
  {
    label: "Environment Variables",
    screen: "environment-variable-list" as ScreenName,
  },
];

const DANGER_ZONE_ITEMS: readonly GameManagementItem[] = [
  { label: "Delete Game", action: "delete-game" },
];

export const GAME_MANAGEMENT_ITEMS: readonly GameManagementItem[] = [
  ...GAME_ITEMS,
  ...MEDIA_ITEMS,
  ...CONFIGURATION_ITEMS,
  ...DANGER_ZONE_ITEMS,
];

export const GAME_MANAGEMENT_ROWS: readonly GameManagementRow[] = [
  { kind: "group-header", label: "GAME" },
  ...GAME_ITEMS.map((item): GameManagementRow => ({ kind: "item", item })),
  { kind: "group-header", label: "MEDIA" },
  ...MEDIA_ITEMS.map((item): GameManagementRow => ({ kind: "item", item })),
  { kind: "group-header", label: "CONFIGURATION" },
  ...CONFIGURATION_ITEMS.map(
    (item): GameManagementRow => ({ kind: "item", item }),
  ),
  { kind: "group-header", label: "DANGER ZONE", danger: true },
  ...DANGER_ZONE_ITEMS.map(
    (item): GameManagementRow => ({ kind: "item", item }),
  ),
];

export function wrapIndex(
  index: number,
  delta: number,
  length: number,
): number {
  return (index + delta + length) % length;
}
