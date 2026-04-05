import type { ControllerFamiliesState } from "./types";

export const SEED_CONTROLLER_FAMILIES: ControllerFamiliesState = {
  families: [
    { id: "family-logitech", name: "Logitech" },
    { id: "family-xbox", name: "Microsoft Xbox" },
    { id: "family-dualshock", name: "Sony DualShock" },
  ],
  controllers: [
    {
      id: "controller-logitech-f310",
      deviceName: "Logitech F310",
      guid: "030000006d04000019c2000010010000",
      familyId: "family-logitech",
    },
    {
      id: "controller-xbox-360",
      deviceName: "Xbox 360 Controller",
      guid: "030000005e0400008e02000010010000",
      familyId: "family-xbox",
    },
    {
      id: "controller-dualshock-4",
      deviceName: "DualShock 4",
      guid: "030000004c050000c405000011010000",
      familyId: null,
    },
  ],
};
