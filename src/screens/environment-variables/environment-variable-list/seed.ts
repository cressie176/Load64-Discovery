import type { EnvVarsState } from "./types";

export const SEED_ENV_VARS: EnvVarsState = {
	owners: [
		{
			id: "family-logitech",
			name: "Logitech",
			type: "family",
			parentIds: [],
		},
		{
			id: "controller-logitech-dual-action",
			name: "Logitech Dual Action",
			type: "controller",
			parentIds: ["family-logitech"],
		},
		{
			id: "ctrl-dualshock4",
			name: "DualShock 4",
			type: "controller",
			parentIds: [],
		},
		{
			id: "ctrl-xbox-wireless",
			name: "Xbox Wireless Controller",
			type: "controller",
			parentIds: [],
		},
		{
			id: "profile-default",
			name: "Default",
			type: "profile",
			parentIds: [],
		},
		{
			id: "profile-sid-8580",
			name: "SID 8580",
			type: "profile",
			parentIds: [],
		},
		{
			id: "launch-config-monty",
			name: "Monty on the Run",
			type: "launch-config",
			parentIds: ["profile-default", "profile-sid-8580"],
		},
	],
	variables: [
		// Logitech family variables
		{
			id: "ev-1",
			ownerId: "family-logitech",
			name: "SDL_JOYSTICK_MFI",
			value: "0",
		},
		{
			id: "ev-2",
			ownerId: "family-logitech",
			name: "SDL_JOYSTICK_ALLOW_BACKGROUND",
			value: "1",
		},
		// Logitech Dual Action controller variable (overrides family + adds own)
		{
			id: "ev-3",
			ownerId: "controller-logitech-dual-action",
			name: "SDL_JOYSTICK_BLACKLIST_DEVICES",
			value: "0xAAAA/0xBBBB",
		},
		// Default profile variables
		{
			id: "ev-4",
			ownerId: "profile-default",
			name: "SDL_JOYSTICK_ALLOW_BACKGROUND",
			value: "1",
		},
		{
			id: "ev-5",
			ownerId: "profile-default",
			name: "VICE_SOUND_DRIVER",
			value: "coreaudio",
		},
		// SID 8580 profile variables
		{
			id: "ev-6",
			ownerId: "profile-sid-8580",
			name: "SID_FILTER",
			value: "1",
		},
		// Monty on the Run launch config variable
		{
			id: "ev-7",
			ownerId: "launch-config-monty",
			name: "VICE_AUTOSTART",
			value: "1",
		},
	],
};
