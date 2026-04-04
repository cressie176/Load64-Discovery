import { createContext, type ReactNode, useContext, useState } from "react";
import { SEED_BINARIES } from "../screens/admin/binary-list/seed";
import type { BinaryList } from "../screens/admin/binary-list/types";
import { SEED_GENERAL_SETTINGS } from "../screens/admin/general-settings/seed";
import type { GeneralSettings } from "../screens/admin/general-settings/types";

interface Store {
	generalSettings: GeneralSettings;
	binaries: BinaryList;
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
