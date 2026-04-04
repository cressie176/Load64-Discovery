export type ControllerStatus = "not-configured" | "connected" | "disconnected";

export interface Controller {
	id: string;
	guid: string;
	name: string;
	connectedCount: number;
	status: ControllerStatus;
}

export type ControllerList = Controller[];
