export type CanonicalControlName =
	| "button_south"
	| "button_east"
	| "button_west"
	| "button_north"
	| "dpad_up"
	| "dpad_down"
	| "dpad_left"
	| "dpad_right"
	| "start"
	| "back";

export const CANONICAL_CONTROL_LABELS: Record<CanonicalControlName, string> = {
	button_south: "Button South",
	button_east: "Button East",
	button_west: "Button West",
	button_north: "Button North",
	dpad_up: "D-Pad Up",
	dpad_down: "D-Pad Down",
	dpad_left: "D-Pad Left",
	dpad_right: "D-Pad Right",
	start: "Start",
	back: "Back",
};

export const CANONICAL_CONTROL_ORDER: CanonicalControlName[] = [
	"button_south",
	"button_east",
	"button_west",
	"button_north",
	"dpad_up",
	"dpad_down",
	"dpad_left",
	"dpad_right",
	"start",
	"back",
];

export type ControlOwnerType = "family" | "controller";

export interface ControlEntry {
	id: string;
	ownerId: string;
	controlName: string;
	canonicalName: CanonicalControlName;
	event: string;
}

export interface ControlOwner {
	id: string;
	name: string;
	type: ControlOwnerType;
	familyId?: string;
	familyName?: string;
}

export interface ControlsState {
	owners: ControlOwner[];
	controls: ControlEntry[];
}

export interface ControlRow {
	canonicalName: CanonicalControlName;
	canonicalLabel: string;
	controlName: string;
	event: string;
	sourceLabel: string | null;
	isInherited: boolean;
	entryId: string | null;
}
