import { createContext, type ReactNode, useContext, useState } from "react";
import { SEED_BINARIES } from "../screens/admin/binary-list/seed";
import type { BinaryList } from "../screens/admin/binary-list/types";
import { SEED_GENERAL_SETTINGS } from "../screens/admin/general-settings/seed";
import type { GeneralSettings } from "../screens/admin/general-settings/types";
import { SEED_CAROUSEL } from "../screens/carousel/game-carousel/seed";
import type { CarouselState } from "../screens/carousel/game-carousel/types";
import { SEED_COMPILATIONS } from "../screens/compilations/compilation-list/seed";
import type { CompilationsState } from "../screens/compilations/compilation-list/types";
import { SEED_CONTROLLER_FAMILIES } from "../screens/controller-families/controller-family-selection/seed";
import type { ControllerFamiliesState } from "../screens/controller-families/controller-family-selection/types";
import { SEED_CONTROLLERS } from "../screens/controllers/controller-list/seed";
import type { ControllerList } from "../screens/controllers/controller-list/types";
import { SEED_CONTROLS } from "../screens/controls/control-list/seed";
import type { ControlsState } from "../screens/controls/control-list/types";
import { SEED_ENV_VARS } from "../screens/environment-variables/environment-variable-list/seed";
import type { EnvVarsState } from "../screens/environment-variables/environment-variable-list/types";
import { SEED_GAME_DETAILS } from "../screens/games/game-details/seed";
import type { GameDetailsState } from "../screens/games/game-details/types";
import { SEED_IMPORT_DISCOVERY } from "../screens/import/import-discovery/seed";
import type { ImportDiscoveryState } from "../screens/import/import-discovery/types";
import { SEED_KEY_MAPPINGS } from "../screens/key-mappings/key-mapping-list/seed";
import type { KeyMappingsState } from "../screens/key-mappings/key-mapping-list/types";
import { SEED_PROFILE_DETAIL } from "../screens/profiles/profile-detail/seed";
import type { ProfileDetailState } from "../screens/profiles/profile-detail/types";
import { SEED_PROFILES } from "../screens/profiles/profile-list/seed";
import type { ProfilesState } from "../screens/profiles/profile-list/types";
import { SEED_VICE_ARGUMENTS } from "../screens/vice-arguments/vice-argument-list/seed";
import type { ViceArgumentsState } from "../screens/vice-arguments/vice-argument-list/types";

interface Store {
  generalSettings: GeneralSettings;
  binaries: BinaryList;
  carousel: CarouselState;
  gameDetails: GameDetailsState;
  controllers: ControllerList;
  viceArguments: ViceArgumentsState;
  profiles: ProfilesState;
  profileDetail: ProfileDetailState;
  compilations: CompilationsState;
  controllerFamilies: ControllerFamiliesState;
  controls: ControlsState;
  keyMappings: KeyMappingsState;
  environmentVariables: EnvVarsState;
  discoveryMessage: string;
  importDiscovery: ImportDiscoveryState;
}

interface StoreContextValue {
  store: Store;
  setStore: (updater: (prev: Store) => Store) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

interface StoreProviderProps {
  children: ReactNode;
}

const INITIAL_STORE: Store = {
  generalSettings: SEED_GENERAL_SETTINGS,
  binaries: SEED_BINARIES,
  carousel: SEED_CAROUSEL,
  gameDetails: SEED_GAME_DETAILS,
  controllers: SEED_CONTROLLERS,
  viceArguments: SEED_VICE_ARGUMENTS,
  profiles: SEED_PROFILES,
  profileDetail: SEED_PROFILE_DETAIL,
  compilations: SEED_COMPILATIONS,
  controllerFamilies: SEED_CONTROLLER_FAMILIES,
  controls: SEED_CONTROLS,
  keyMappings: SEED_KEY_MAPPINGS,
  environmentVariables: SEED_ENV_VARS,
  discoveryMessage: "",
  importDiscovery: SEED_IMPORT_DISCOVERY,
};

export function StoreProvider({ children }: StoreProviderProps) {
  const [store, setStore] = useState<Store>(INITIAL_STORE);

  return (
    <StoreContext.Provider value={{ store, setStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}
