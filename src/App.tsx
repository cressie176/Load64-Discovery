import { RouterProvider, useRouter } from "./router/RouterContext";
import { AdminHubScreen } from "./screens/admin/admin-hub/AdminHubScreen";
import { BinaryListScreen } from "./screens/admin/binary-list/BinaryListScreen";
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
	if (currentScreen === "binary-list") {
		return <BinaryListScreen />;
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
