import type { ControllerFamiliesState } from "./types";

export const SEED_CONTROLLER_FAMILIES: ControllerFamiliesState = {
	families: [
		{ id: "family-logitech", name: "Logitech" },
		{ id: "family-xbox", name: "Microsoft Xbox" },
		{ id: "family-dualshock", name: "Sony DualShock" },
	],
	controllers: [
		{
			id: "ctrl-usb-gamepad",
			deviceName: "USB Gamepad",
			guid: "030000005e040000ea02000000007803",
			familyId: null,
		},
		{
			id: "ctrl-dualshock4",
			deviceName: "DualShock 4",
			guid: "030000004c050000cc09000000006803",
			familyId: "family-dualshock",
		},
		{
			id: "ctrl-logitech-dual-action",
			deviceName: "Logitech Dual Action",
			guid: "030000006d04000016c2000000006803",
			familyId: "family-logitech",
		},
		{
			id: "ctrl-xbox-wireless",
			deviceName: "Xbox Wireless Controller",
			guid: "030000005e040000ea02000000008803",
			familyId: "family-xbox",
		},
		{
			id: "ctrl-8bitdo-pro2",
			deviceName: "8BitDo Pro 2",
			guid: "050000003512000021ab000000780f00",
			familyId: null,
		},
	],
};
