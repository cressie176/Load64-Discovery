import { RouterProvider, useRouter } from "./router/RouterContext";
import { AdminHubScreen } from "./screens/admin/admin-hub/AdminHubScreen";
import { BinaryDiscoverScreen } from "./screens/admin/binary-discover/BinaryDiscoverScreen";
import { BinaryEditScreen } from "./screens/admin/binary-edit/BinaryEditScreen";
import { BinaryListScreen } from "./screens/admin/binary-list/BinaryListScreen";
import { GeneralSettingsScreen } from "./screens/admin/general-settings/GeneralSettingsScreen";
import { GameCarouselScreen } from "./screens/carousel/game-carousel/GameCarouselScreen";
import { CompilationDetailScreen } from "./screens/compilations/compilation-detail/CompilationDetailScreen";
import { CompilationEditScreen } from "./screens/compilations/compilation-edit/CompilationEditScreen";
import { CompilationListScreen } from "./screens/compilations/compilation-list/CompilationListScreen";
import { CompilationMembershipScreen } from "./screens/compilations/compilation-membership/CompilationMembershipScreen";
import { ControllerFamilyEditScreen } from "./screens/controller-families/controller-family-edit/ControllerFamilyEditScreen";
import { ControllerFamilyListScreen } from "./screens/controller-families/controller-family-list/ControllerFamilyListScreen";
import { ControllerFamilySelectionScreen } from "./screens/controller-families/controller-family-selection/ControllerFamilySelectionScreen";
import { ControllerDetailScreen } from "./screens/controllers/controller-detail/ControllerDetailScreen";
import { ControllerListScreen } from "./screens/controllers/controller-list/ControllerListScreen";
import { ControllerSelectionScreen } from "./screens/controllers/controller-selection/ControllerSelectionScreen";
import { ControlEditScreen } from "./screens/controls/control-edit/ControlEditScreen";
import { ControlListScreen } from "./screens/controls/control-list/ControlListScreen";
import { EnvironmentVariableEditScreen } from "./screens/environment-variables/environment-variable-edit/EnvironmentVariableEditScreen";
import { EnvironmentVariableListScreen } from "./screens/environment-variables/environment-variable-list/EnvironmentVariableListScreen";
import { KeyMappingEditScreen } from "./screens/key-mappings/key-mapping-edit/KeyMappingEditScreen";
import { KeyMappingListScreen } from "./screens/key-mappings/key-mapping-list/KeyMappingListScreen";
import { Placeholder } from "./screens/Placeholder";
import { ProfileDetailScreen } from "./screens/profiles/profile-detail/ProfileDetailScreen";
import { ProfileEditScreen } from "./screens/profiles/profile-edit/ProfileEditScreen";
import { ProfileListScreen } from "./screens/profiles/profile-list/ProfileListScreen";
import { ViceArgumentEditScreen } from "./screens/vice-arguments/vice-argument-edit/ViceArgumentEditScreen";
import { ViceArgumentListScreen } from "./screens/vice-arguments/vice-argument-list/ViceArgumentListScreen";
import { StoreProvider } from "./store/StoreContext";

function AppScreens() {
	const { currentScreen, currentParams } = useRouter();
	if (currentScreen === "carousel") {
		return <GameCarouselScreen compilationId={currentParams.compilationId} />;
	}
	if (currentScreen === "game-details") {
		return <Placeholder name="Game Details" />;
	}
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
	if (currentScreen === "controller-list") {
		return <ControllerListScreen />;
	}
	if (currentScreen === "controller-detail") {
		return (
			<ControllerDetailScreen
				controllerId={currentParams.controllerId ?? "ctrl-logitech-dual-action"}
				statusMessage={currentParams.statusMessage}
			/>
		);
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
		return <ViceArgumentEditScreen />;
	}
	if (currentScreen === "profile-list") {
		return <ProfileListScreen statusMessage={currentParams.statusMessage} />;
	}
	if (currentScreen === "profile-detail") {
		return (
			<ProfileDetailScreen
				profileId={currentParams.profileId ?? "profile-default"}
			/>
		);
	}
	if (currentScreen === "controller-selection") {
		return (
			<ControllerSelectionScreen
				profileId={currentParams.profileId ?? "profile-default"}
				ownerName={currentParams.ownerName}
			/>
		);
	}
	if (currentScreen === "key-mapping-list") {
		return (
			<KeyMappingListScreen
				ownerId={
					currentParams.ownerId ?? currentParams.profileId ?? "profile-default"
				}
				statusMessage={currentParams.statusMessage}
			/>
		);
	}
	if (currentScreen === "key-mapping-edit") {
		return <KeyMappingEditScreen />;
	}
	if (currentScreen === "environment-variable-list") {
		return (
			<EnvironmentVariableListScreen
				ownerId={
					currentParams.ownerId ?? currentParams.profileId ?? "profile-default"
				}
				statusMessage={currentParams.statusMessage}
			/>
		);
	}
	if (currentScreen === "environment-variable-edit") {
		return <EnvironmentVariableEditScreen />;
	}
	if (currentScreen === "profile-edit") {
		return <ProfileEditScreen profileId={currentParams.profileId} />;
	}
	if (currentScreen === "compilation-list") {
		const mode = currentParams.mode === "browse" ? "browse" : "admin";
		return (
			<CompilationListScreen
				mode={mode}
				statusMessage={currentParams.statusMessage}
			/>
		);
	}
	if (currentScreen === "compilation-detail") {
		return (
			<CompilationDetailScreen
				compilationId={currentParams.compilationId ?? "compilation-all-games"}
				statusMessage={currentParams.statusMessage}
			/>
		);
	}
	if (currentScreen === "compilation-edit") {
		return (
			<CompilationEditScreen compilationId={currentParams.compilationId} />
		);
	}
	if (currentScreen === "compilation-membership") {
		return (
			<CompilationMembershipScreen
				compilationId={currentParams.compilationId ?? "compilation-all-games"}
			/>
		);
	}
	if (currentScreen === "controller-family-list") {
		return (
			<ControllerFamilyListScreen statusMessage={currentParams.statusMessage} />
		);
	}
	if (currentScreen === "controller-family-edit") {
		return <ControllerFamilyEditScreen familyId={currentParams.familyId} />;
	}
	if (currentScreen === "controller-family-selection") {
		return (
			<ControllerFamilySelectionScreen
				controllerId={currentParams.controllerId ?? "controller-logitech-f310"}
			/>
		);
	}
	if (currentScreen === "control-list") {
		return (
			<ControlListScreen
				ownerId={currentParams.ownerId ?? "family-logitech"}
				statusMessage={currentParams.statusMessage}
			/>
		);
	}
	if (currentScreen === "control-edit") {
		return <ControlEditScreen />;
	}
	return <GameCarouselScreen />;
}

export function App() {
	return (
		<StoreProvider>
			<RouterProvider initialScreen="carousel">
				<AppScreens />
			</RouterProvider>
		</StoreProvider>
	);
}
