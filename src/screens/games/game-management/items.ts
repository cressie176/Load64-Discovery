import type { ScreenName } from "../../../types/router";

type MediaSlot =
  | "cover-thumbnail"
  | "loading-screen"
  | "title-screen"
  | "gameplay-screen";

type ItemWithScreen = {
  label: string;
  screen: ScreenName;
  mediaSlot?: MediaSlot;
  action?: never;
  deleteAction?: never;
};

type ItemWithAction = {
  label: string;
  screen?: never;
  mediaSlot?: never;
  action: "delete-game";
  deleteAction?: never;
};

export type GameManagementItem = ItemWithScreen | ItemWithAction;

export type GameManagementRow =
  | { kind: "group-header"; label: string }
  | { kind: "item"; item: GameManagementItem };

const GAME_ITEMS: readonly GameManagementItem[] = [
  { label: "Game Info", screen: "game-info-edit" as ScreenName },
  {
    label: "Catalogue Sources",
    screen: "game-catalogue-sources-list" as ScreenName,
  },
  { label: "ROMs", screen: "game-rom-list" as ScreenName },
  { label: "Snapshots", screen: "snapshot-list" as ScreenName },
];

const MEDIA_ITEMS: readonly GameManagementItem[] = [
  {
    label: "Cover Thumbnail",
    screen: "game-media-edit" as ScreenName,
    mediaSlot: "cover-thumbnail",
  },
  {
    label: "Loading Screen",
    screen: "game-media-edit" as ScreenName,
    mediaSlot: "loading-screen",
  },
  {
    label: "Title Screen",
    screen: "game-media-edit" as ScreenName,
    mediaSlot: "title-screen",
  },
  {
    label: "Gameplay Screen",
    screen: "game-media-edit" as ScreenName,
    mediaSlot: "gameplay-screen",
  },
];

const CONFIGURATION_ITEMS: readonly GameManagementItem[] = [
  { label: "Controls", screen: "game-control-list" as ScreenName },
  { label: "Controllers", screen: "controller-selection" as ScreenName },
  { label: "Profiles", screen: "game-profiles-selection" as ScreenName },
  { label: "VICE Arguments", screen: "vice-argument-list" as ScreenName },
  { label: "Key Mappings", screen: "key-mapping-list" as ScreenName },
  {
    label: "Environment Variables",
    screen: "environment-variable-list" as ScreenName,
  },
];

const UNGROUPED_ITEMS: readonly GameManagementItem[] = [
  { label: "Delete Game", action: "delete-game" },
];

export const GAME_MANAGEMENT_ITEMS: readonly GameManagementItem[] = [
  ...GAME_ITEMS,
  ...MEDIA_ITEMS,
  ...CONFIGURATION_ITEMS,
  ...UNGROUPED_ITEMS,
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
  ...UNGROUPED_ITEMS.map((item): GameManagementRow => ({ kind: "item", item })),
];

export function wrapIndex(
  index: number,
  delta: number,
  length: number,
): number {
  return (index + delta + length) % length;
}
