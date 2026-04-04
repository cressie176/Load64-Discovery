import { createContext, type ReactNode, useContext, useState } from "react";

// Store shape grows as screens are implemented
// biome-ignore lint/complexity/noBannedTypes: intentional empty placeholder, expanded per screen
type Store = {};

interface StoreContextValue {
	store: Store;
	setStore: (updater: (prev: Store) => Store) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

interface StoreProviderProps {
	children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
	const [store, setStore] = useState<Store>({});

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
