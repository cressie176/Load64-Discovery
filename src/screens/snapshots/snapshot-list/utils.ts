export function buildContextMenuItems(
  groupSize: number,
  snapshotIndex: number,
): string[] {
  const items: string[] = ["Delete"];
  if (groupSize > 1) items.push("Delete Others");
  if (snapshotIndex < groupSize - 1) items.push("Delete Subsequent");
  return items;
}
