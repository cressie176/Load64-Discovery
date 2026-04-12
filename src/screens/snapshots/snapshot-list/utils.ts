export function buildContextMenuItems(
  groupSize: number,
  snapshotIndex: number,
): string[] {
  const items: string[] = ["Delete"];
  if (groupSize > 1) items.push("Delete Others");
  if (snapshotIndex > 0) items.push("Delete Newer");
  if (snapshotIndex < groupSize - 1) items.push("Delete Older");
  return items;
}
