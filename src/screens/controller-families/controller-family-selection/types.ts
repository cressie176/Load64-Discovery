export interface ControllerFamily {
  id: string;
  name: string;
}

export interface Controller {
  id: string;
  deviceName: string;
  guid: string;
  familyId: string | null;
}

export interface ControllerFamiliesState {
  families: ControllerFamily[];
  controllers: Controller[];
}
