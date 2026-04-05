import type { ControllerList } from "./types";

export const SEED_CONTROLLERS: ControllerList = [
	{
		id: "ctrl-usb-gamepad",
		guid: "030000005e040000ea02000000007803",
		name: "USB Gamepad",
		deviceCount: 1,
		connectedCount: 1,
		status: "not-configured",
	},
	{
		id: "ctrl-dualshock4",
		guid: "030000004c050000cc09000000006803",
		name: "DualShock 4",
		familyName: "Sony DualShock",
		deviceCount: 1,
		connectedCount: 0,
		status: "disconnected",
	},
	{
		id: "ctrl-logitech-dual-action",
		guid: "030000006d04000016c2000000006803",
		name: "Logitech Dual Action",
		familyName: "Logitech",
		deviceCount: 2,
		connectedCount: 1,
		status: "connected",
	},
	{
		id: "ctrl-xbox-wireless",
		guid: "030000005e040000ea02000000008803",
		name: "Xbox Wireless Controller",
		familyName: "Microsoft Xbox",
		deviceCount: 1,
		connectedCount: 1,
		status: "connected",
	},
	{
		id: "ctrl-8bitdo-pro2",
		guid: "050000003512000021ab000000780f00",
		name: "8BitDo Pro 2",
		deviceCount: 1,
		connectedCount: 0,
		status: "disconnected-unconfigured",
	},
];
