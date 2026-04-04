import { RouterProvider, useRouter } from "./router/RouterContext";
import { AdminHubScreen } from "./screens/admin/admin-hub/AdminHubScreen";
import { GeneralSettingsScreen } from "./screens/admin/general-settings/GeneralSettingsScreen";
import { Placeholder } from "./screens/Placeholder";
import { StoreProvider } from "./store/StoreContext";

function AppScreens() {
	const { currentScreen } = useRouter();
	if (currentScreen === "admin-hub") {
		return <AdminHubScreen />;
	}
	if (currentScreen === "general-settings") {
		return <GeneralSettingsScreen />;
	}
	return <Placeholder name="Game Carousel" />;
}

export function App() {
	return (
		<StoreProvider>
			<RouterProvider initialScreen="admin-hub">
				<AppScreens />
			</RouterProvider>
		</StoreProvider>
	);
}
