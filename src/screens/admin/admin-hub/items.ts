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

export type AdminHubRow =
  | { kind: "group-header"; label: string; danger?: true }
  | { kind: "item"; item: AdminHubItem };

const SYSTEM_CONFIGURATION_ITEMS: readonly AdminHubItem[] = [
  { label: "General Settings", screen: "general-settings" as ScreenName },
  { label: "Binaries", screen: "binary-list" as ScreenName },
];

const GAMING_CONFIGURATION_ITEMS: readonly AdminHubItem[] = [
  {
    label: "Controller Families",
    screen: "controller-family-list" as ScreenName,
  },
  { label: "Controllers", screen: "controller-list" as ScreenName },
  { label: "Profiles", screen: "profile-list" as ScreenName },
  { label: "Compilations", screen: "compilation-list" as ScreenName },
];

const TOOLS_ITEMS: readonly AdminHubItem[] = [
  { label: "Import Games", screen: "import-games" as ScreenName },
  {
    label: "Update Load!64 Catalogue",
    screen: "load64-catalogue-update" as ScreenName,
  },
  { label: "Audit", screen: "audit" as ScreenName },
];

const DANGER_ZONE_ITEMS: readonly AdminHubItem[] = [
  { label: "Quit Load!64", action: "quit" },
];

export const ADMIN_HUB_ITEMS: readonly AdminHubItem[] = [
  ...SYSTEM_CONFIGURATION_ITEMS,
  ...GAMING_CONFIGURATION_ITEMS,
  ...TOOLS_ITEMS,
  ...DANGER_ZONE_ITEMS,
];

export const ADMIN_HUB_ROWS: readonly AdminHubRow[] = [
  { kind: "group-header", label: "SYSTEM CONFIGURATION" },
  ...SYSTEM_CONFIGURATION_ITEMS.map(
    (item): AdminHubRow => ({ kind: "item", item }),
  ),
  { kind: "group-header", label: "GAMING CONFIGURATION" },
  ...GAMING_CONFIGURATION_ITEMS.map(
    (item): AdminHubRow => ({ kind: "item", item }),
  ),
  { kind: "group-header", label: "TOOLS" },
  ...TOOLS_ITEMS.map((item): AdminHubRow => ({ kind: "item", item })),
  { kind: "group-header", label: "DANGER ZONE", danger: true },
  ...DANGER_ZONE_ITEMS.map((item): AdminHubRow => ({ kind: "item", item })),
];

export const QUIT_OPTIONS = ["Yes", "No"] as const;

export function wrapIndex(
  index: number,
  delta: number,
  length: number,
): number {
  return (index + delta + length) % length;
}
