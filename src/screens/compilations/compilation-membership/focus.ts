export type FocusRegion = "list" | "actions";
export type ActionField = "save" | "cancel";

export interface FocusState {
  region: FocusRegion;
  action: ActionField;
}

const ACTION_FIELDS: ActionField[] = ["save", "cancel"];

export function nextFocusState(
  current: FocusState,
  reverse: boolean,
): FocusState {
  if (current.region === "list") {
    const action = reverse
      ? ACTION_FIELDS[ACTION_FIELDS.length - 1]
      : ACTION_FIELDS[0];
    return { region: "actions", action: action as ActionField };
  }

  const idx = ACTION_FIELDS.indexOf(current.action);
  const nextIdx = idx + (reverse ? -1 : 1);

  if (nextIdx >= 0 && nextIdx < ACTION_FIELDS.length) {
    return { region: "actions", action: ACTION_FIELDS[nextIdx] as ActionField };
  }

  return { region: "list", action: current.action };
}
