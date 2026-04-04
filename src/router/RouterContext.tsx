import { createContext, type ReactNode, useContext, useState } from "react";
import type { ScreenName } from "../types/router";

export type { ScreenName };

interface RouterContextValue {
	currentScreen: ScreenName;
	push: (screen: ScreenName) => void;
	pop: () => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

interface RouterProviderProps {
	children: ReactNode;
	initialScreen?: ScreenName;
}

export function RouterProvider({
	children,
	initialScreen = "admin-hub",
}: RouterProviderProps) {
	const [stack, setStack] = useState<ScreenName[]>([initialScreen]);

	const currentScreen = stack[stack.length - 1] ?? "carousel";

	function push(screen: ScreenName) {
		setStack((prev) => [...prev, screen]);
	}

	function pop() {
		setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
	}

	return (
		<RouterContext.Provider value={{ currentScreen, push, pop }}>
			{children}
		</RouterContext.Provider>
	);
}

export function useRouter(): RouterContextValue {
	const context = useContext(RouterContext);
	if (!context) throw new Error("useRouter must be used within RouterProvider");
	return context;
}
