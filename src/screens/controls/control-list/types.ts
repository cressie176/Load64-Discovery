export type CanonicalControlName =
	| "button_south"
	| "button_east"
	| "button_west"
	| "button_north"
	| "dpad_up"
	| "dpad_down"
	| "dpad_left"
	| "dpad_right"
	| "left_shoulder"
	| "right_shoulder"
	| "left_trigger"
	| "right_trigger"
	| "left_stick_x"
	| "left_stick_y"
	| "left_stick_press"
	| "right_stick_x"
	| "right_stick_y"
	| "right_stick_press"
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
	left_shoulder: "Left Shoulder",
	right_shoulder: "Right Shoulder",
	left_trigger: "Left Trigger",
	right_trigger: "Right Trigger",
	left_stick_x: "Left Stick X",
	left_stick_y: "Left Stick Y",
	left_stick_press: "Left Stick Press",
	right_stick_x: "Right Stick X",
	right_stick_y: "Right Stick Y",
	right_stick_press: "Right Stick Press",
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
	"left_shoulder",
	"right_shoulder",
	"left_trigger",
	"right_trigger",
	"left_stick_x",
	"left_stick_y",
	"left_stick_press",
	"right_stick_x",
	"right_stick_y",
	"right_stick_press",
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
