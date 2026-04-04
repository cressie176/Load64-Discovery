import { RouterProvider, useRouter } from "./router/RouterContext";
import { AdminHubScreen } from "./screens/admin/AdminHubScreen";
import { Placeholder } from "./screens/Placeholder";
import { StoreProvider } from "./store/StoreContext";

function AppScreens() {
	const { currentScreen } = useRouter();
	if (currentScreen === "admin-hub") {
		return <AdminHubScreen />;
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
