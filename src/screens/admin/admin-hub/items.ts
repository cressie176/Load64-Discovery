import type { ScreenName } from "../../../types/router";

type ItemWithScreen = {
  label: string;
  screen: ScreenName;
  action?: never;
};

type ItemWithAction = {
  label: string;
  screen?: never;
  action: "quit";
};

export type AdminHubItem = ItemWithScreen | ItemWithAction;

export const ADMIN_HUB_ITEMS: readonly AdminHubItem[] = [
  { label: "General Settings", screen: "general-settings" as ScreenName },
  { label: "Binaries", screen: "binary-list" as ScreenName },
  {
    label: "Controller Families",
    screen: "controller-family-list" as ScreenName,
  },
  { label: "Controllers", screen: "controller-list" as ScreenName },
  { label: "Profiles", screen: "profile-list" as ScreenName },
  { label: "Compilations", screen: "compilation-list" as ScreenName },
  { label: "Import Games", screen: "import-games" as ScreenName },
  { label: "Audit", screen: "audit" as ScreenName },
  { label: "Quit Load!64", action: "quit" },
] as const;

export const QUIT_OPTIONS = ["Yes", "No"] as const;

export function wrapIndex(
  index: number,
  delta: number,
  length: number,
): number {
  return (index + delta + length) % length;
}
