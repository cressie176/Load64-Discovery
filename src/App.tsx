import { RouterProvider, useRouter } from "./router/RouterContext";
import { AdminHubScreen } from "./screens/admin/admin-hub/AdminHubScreen";
import { BinaryDiscoverScreen } from "./screens/admin/binary-discover/BinaryDiscoverScreen";
import { BinaryEditScreen } from "./screens/admin/binary-edit/BinaryEditScreen";
import { BinaryListScreen } from "./screens/admin/binary-list/BinaryListScreen";
import { GeneralSettingsScreen } from "./screens/admin/general-settings/GeneralSettingsScreen";
import { Placeholder } from "./screens/Placeholder";
import { ProfileListScreen } from "./screens/profiles/profile-list/ProfileListScreen";
import { ViceArgumentListScreen } from "./screens/vice-arguments/vice-argument-list/ViceArgumentListScreen";
import { StoreProvider } from "./store/StoreContext";

function AppScreens() {
	const { currentScreen, currentParams } = useRouter();
	if (currentScreen === "admin-hub") {
		return <AdminHubScreen />;
	}
	if (currentScreen === "general-settings") {
		return <GeneralSettingsScreen />;
	}
	if (currentScreen === "binary-list") {
		return <BinaryListScreen />;
	}
	if (currentScreen === "binary-edit") {
		return <BinaryEditScreen />;
	}
	if (currentScreen === "binary-discover") {
		return <BinaryDiscoverScreen />;
	}
	if (currentScreen === "vice-argument-list") {
		return (
			<ViceArgumentListScreen
				ownerId={currentParams.ownerId ?? "profile-default"}
				statusMessage={currentParams.statusMessage}
			/>
		);
	}
	if (currentScreen === "vice-argument-edit") {
		return <Placeholder name="Vice Argument Edit" />;
	}
	if (currentScreen === "profile-list") {
		return <ProfileListScreen statusMessage={currentParams.statusMessage} />;
	}
	if (currentScreen === "profile-detail") {
		return <Placeholder name="Profile Detail" />;
	}
	if (currentScreen === "profile-edit") {
		return <Placeholder name="Profile Edit" />;
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
