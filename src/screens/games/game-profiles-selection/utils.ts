import type { GameProfileRef } from "../../profiles/profile-list/types";
import type { AssignedProfile } from "./types";

export function buildPendingProfiles(
  gameProfileRefs: GameProfileRef[],
  profiles: { id: string; name: string }[],
  gameId: string,
): AssignedProfile[] {
  const refs = gameProfileRefs
    .filter((r) => r.gameId === gameId)
    .sort((a, b) => a.order - b.order);
  const result: AssignedProfile[] = [];
  for (const ref of refs) {
    const profile = profiles.find((p) => p.id === ref.profileId);
    if (profile) {
      result.push({ id: profile.id, name: profile.name, order: ref.order });
    }
  }
  return result;
}

export function addProfile(
  pending: AssignedProfile[],
  profile: { id: string; name: string },
): AssignedProfile[] {
  return [
    ...pending,
    { id: profile.id, name: profile.name, order: pending.length + 1 },
  ];
}

export function removeProfile(
  pending: AssignedProfile[],
  id: string,
): AssignedProfile[] {
  return pending
    .filter((p) => p.id !== id)
    .map((p, i) => ({ ...p, order: i + 1 }));
}

export function moveProfile(
  pending: AssignedProfile[],
  index: number,
  delta: number,
): AssignedProfile[] {
  if (pending.length < 2) return pending;
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= pending.length) return pending;
  const result = [...pending];
  const [moved] = result.splice(index, 1);
  result.splice(newIndex, 0, moved);
  return result.map((p, i) => ({ ...p, order: i + 1 }));
}

export function cancelReorder(
  pending: AssignedProfile[],
  currentIndex: number,
  originIndex: number,
): AssignedProfile[] {
  if (currentIndex === originIndex) return pending;
  const result = [...pending];
  const [moved] = result.splice(currentIndex, 1);
  result.splice(originIndex, 0, moved);
  return result.map((p, i) => ({ ...p, order: i + 1 }));
}

export function getUnassignedProfiles(
  allProfiles: { id: string; name: string }[],
  pending: AssignedProfile[],
): { id: string; name: string }[] {
  const assignedIds = new Set(pending.map((p) => p.id));
  return [...allProfiles]
    .filter((p) => !assignedIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildSaveRefs(
  gameId: string,
  pending: AssignedProfile[],
): GameProfileRef[] {
  return pending.map((p, i) => ({
    gameId,
    profileId: p.id,
    order: i + 1,
  }));
}

export function wrapIndex(
  index: number,
  delta: number,
  length: number,
): number {
  return (index + delta + length) % length;
}
