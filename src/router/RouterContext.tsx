import { createContext, type ReactNode, useContext, useState } from "react";
import type { ScreenName } from "../types/router";

export type { ScreenName };

export type ScreenParams = Record<string, string>;

interface ScreenEntry {
	screen: ScreenName;
	params?: ScreenParams;
}

interface RouterContextValue {
	currentScreen: ScreenName;
	currentParams: ScreenParams;
	push: (screen: ScreenName, params?: ScreenParams) => void;
	pop: () => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

interface RouterProviderProps {
	children: ReactNode;
	initialScreen?: ScreenName;
	initialParams?: ScreenParams;
}

export function RouterProvider({
	children,
	initialScreen = "admin-hub",
	initialParams = {},
}: RouterProviderProps) {
	const [stack, setStack] = useState<ScreenEntry[]>([
		{ screen: initialScreen, params: initialParams },
	]);

	const current = stack[stack.length - 1] ?? {
		screen: "carousel" as ScreenName,
		params: {},
	};
	const currentScreen = current.screen;
	const currentParams = current.params ?? {};

	function push(screen: ScreenName, params?: ScreenParams) {
		setStack((prev) => [...prev, { screen, params }]);
	}

	function pop() {
		setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
	}

	return (
		<RouterContext.Provider value={{ currentScreen, currentParams, push, pop }}>
			{children}
		</RouterContext.Provider>
	);
}

export function useRouter(): RouterContextValue {
	const context = useContext(RouterContext);
	if (!context) throw new Error("useRouter must be used within RouterProvider");
	return context;
}
