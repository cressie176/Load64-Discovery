import type { ViceArgumentsState } from "./types";

export const SEED_VICE_ARGUMENTS: ViceArgumentsState = {
	owners: [
		{
			id: "profile-default",
			name: "Default",
			type: "profile",
			profileIds: [],
		},
		{
			id: "profile-sid-8580",
			name: "SID 8580",
			type: "profile",
			profileIds: [],
		},
		{
			id: "launch-config-monty",
			name: "Monty on the Run",
			type: "launch-config",
			profileIds: ["profile-default", "profile-sid-8580"],
		},
	],
	arguments: [
		{
			id: "arg-1",
			ownerId: "profile-default",
			name: "-autostart-warp",
			value: "",
		},
		{
			id: "arg-2",
			ownerId: "profile-default",
			name: "+confirmonexit",
			value: "",
		},
		{
			id: "arg-3",
			ownerId: "profile-sid-8580",
			name: "-sidmodel",
			value: "8580",
		},
		{
			id: "arg-4",
			ownerId: "launch-config-monty",
			name: "-drive8type",
			value: "1541",
		},
	],
};
