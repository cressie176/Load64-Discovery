export type ControllerStatus =
	| "not-configured"
	| "connected"
	| "disconnected"
	| "disconnected-unconfigured";

export interface Controller {
	id: string;
	guid: string;
	name: string;
	connectedCount: number;
	status: ControllerStatus;
}

export type ControllerList = Controller[];
