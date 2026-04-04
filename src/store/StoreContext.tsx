import { createContext, type ReactNode, useContext, useState } from "react";
import { SEED_BINARIES } from "../screens/admin/binary-list/seed";
import type { BinaryList } from "../screens/admin/binary-list/types";
import { SEED_GENERAL_SETTINGS } from "../screens/admin/general-settings/seed";
import type { GeneralSettings } from "../screens/admin/general-settings/types";
import { SEED_COMPILATIONS } from "../screens/compilations/compilation-list/seed";
import type { CompilationsState } from "../screens/compilations/compilation-list/types";
import { SEED_CONTROLLER_FAMILIES } from "../screens/controller-families/controller-family-selection/seed";
import type { ControllerFamiliesState } from "../screens/controller-families/controller-family-selection/types";
import { SEED_PROFILE_DETAIL } from "../screens/profiles/profile-detail/seed";
import type { ProfileDetailState } from "../screens/profiles/profile-detail/types";
import { SEED_PROFILES } from "../screens/profiles/profile-list/seed";
import type { ProfilesState } from "../screens/profiles/profile-list/types";
import { SEED_VICE_ARGUMENTS } from "../screens/vice-arguments/vice-argument-list/seed";
import type { ViceArgumentsState } from "../screens/vice-arguments/vice-argument-list/types";

interface Store {
	generalSettings: GeneralSettings;
	binaries: BinaryList;
	viceArguments: ViceArgumentsState;
	profiles: ProfilesState;
	profileDetail: ProfileDetailState;
	compilations: CompilationsState;
	controllerFamilies: ControllerFamiliesState;
	discoveryMessage: string;
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
	viceArguments: SEED_VICE_ARGUMENTS,
	profiles: SEED_PROFILES,
	profileDetail: SEED_PROFILE_DETAIL,
	compilations: SEED_COMPILATIONS,
	controllerFamilies: SEED_CONTROLLER_FAMILIES,
	discoveryMessage: "",
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
