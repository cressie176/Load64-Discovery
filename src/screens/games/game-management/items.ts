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

export const GAME_MANAGEMENT_ITEMS: readonly GameManagementItem[] = [
  { label: "Game Info", screen: "game-info-edit" as ScreenName },
  { label: "ROMs", screen: "game-rom-list" as ScreenName },
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
  {
    label: "Catalogue Sources",
    screen: "game-catalogue-sources-list" as ScreenName,
  },
  { label: "Snapshots", screen: "snapshot-list" as ScreenName },
  { label: "Controls", screen: "game-control-list" as ScreenName },
  { label: "Controllers", screen: "controller-selection" as ScreenName },
  { label: "Profiles", screen: "game-profiles-selection" as ScreenName },
  { label: "VICE Arguments", screen: "vice-argument-list" as ScreenName },
  { label: "Key Mappings", screen: "key-mapping-list" as ScreenName },
  {
    label: "Environment Variables",
    screen: "environment-variable-list" as ScreenName,
  },
  { label: "Delete Game", action: "delete-game" },
] as const;

export function wrapIndex(
  index: number,
  delta: number,
  length: number,
): number {
  return (index + delta + length) % length;
}
