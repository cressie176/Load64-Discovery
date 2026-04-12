import { RouterProvider, useRouter } from "./router/RouterContext";
import { AdminHubScreen } from "./screens/admin/admin-hub/AdminHubScreen";
import { BinaryDiscoverScreen } from "./screens/admin/binary-discover/BinaryDiscoverScreen";
import { BinaryEditScreen } from "./screens/admin/binary-edit/BinaryEditScreen";
import { BinaryListScreen } from "./screens/admin/binary-list/BinaryListScreen";
import { GeneralSettingsScreen } from "./screens/admin/general-settings/GeneralSettingsScreen";
import { Load64CatalogueUpdateScreen } from "./screens/admin/load64-catalogue-update/Load64CatalogueUpdateScreen";
import { GameCarouselScreen } from "./screens/carousel/game-carousel/GameCarouselScreen";
import { CompilationDetailScreen } from "./screens/compilations/compilation-detail/CompilationDetailScreen";
import { CompilationEditScreen } from "./screens/compilations/compilation-edit/CompilationEditScreen";
import { CompilationListScreen } from "./screens/compilations/compilation-list/CompilationListScreen";
import { CompilationMembershipScreen } from "./screens/compilations/compilation-membership/CompilationMembershipScreen";
import { ControllerFamilyAssignmentScreen } from "./screens/controller-families/controller-family-assignment/ControllerFamilyAssignmentScreen";
import { ControllerFamilyEditScreen } from "./screens/controller-families/controller-family-edit/ControllerFamilyEditScreen";
import { ControllerFamilyListScreen } from "./screens/controller-families/controller-family-list/ControllerFamilyListScreen";
import { ControllerDetailScreen } from "./screens/controllers/controller-detail/ControllerDetailScreen";
import { ControllerListScreen } from "./screens/controllers/controller-list/ControllerListScreen";
import { ControlEditScreen } from "./screens/controls/control-edit/ControlEditScreen";
import { ControlListScreen } from "./screens/controls/control-list/ControlListScreen";
import { EnvironmentVariableEditScreen } from "./screens/environment-variables/environment-variable-edit/EnvironmentVariableEditScreen";
import { EnvironmentVariableListScreen } from "./screens/environment-variables/environment-variable-list/EnvironmentVariableListScreen";
import { CoverArtScreen } from "./screens/games/game-cover-art/CoverArtScreen";
import { GameDetailsScreen } from "./screens/games/game-details/GameDetailsScreen";
import { GameDetailsEditScreen } from "./screens/games/game-details-edit/GameDetailsEditScreen";
import { GameManagementScreen } from "./screens/games/game-management/GameManagementScreen";
import { GameMediaEditScreen } from "./screens/games/game-media-edit/GameMediaEditScreen";
import { GameRomAddScreen } from "./screens/games/game-rom-add/GameRomAddScreen";
import { GameRomEditScreen } from "./screens/games/game-rom-edit/GameRomEditScreen";
import { GameRomListScreen } from "./screens/games/game-rom-list/GameRomListScreen";
import { ScreenshotsScreen } from "./screens/games/game-screenshots/ScreenshotsScreen";
import { ImportCandidateScreen } from "./screens/import/import-candidate/ImportCandidateScreen";
import { ImportDiscoveryScreen } from "./screens/import/import-discovery/ImportDiscoveryScreen";
import { ImportGamesScreen } from "./screens/import/import-games/ImportGamesScreen";
import { KeyMappingEditScreen } from "./screens/key-mappings/key-mapping-edit/KeyMappingEditScreen";
import { KeyMappingListScreen } from "./screens/key-mappings/key-mapping-list/KeyMappingListScreen";
import { NowPlayingScreen } from "./screens/now-playing/now-playing/NowPlayingScreen";
import { NowPlayingSwapDisksScreen } from "./screens/now-playing/now-playing-swap-disks/NowPlayingSwapDisksScreen";
import { NowPlayingTakeScreenshotScreen } from "./screens/now-playing/now-playing-take-screenshot/NowPlayingTakeScreenshotScreen";
import { NowPlayingTakeSnapshotScreen } from "./screens/now-playing/now-playing-take-snapshot/NowPlayingTakeSnapshotScreen";
import { Placeholder } from "./screens/Placeholder";
import { ProfileDetailScreen } from "./screens/profiles/profile-detail/ProfileDetailScreen";
import { ProfileEditScreen } from "./screens/profiles/profile-edit/ProfileEditScreen";
import { ProfileListScreen } from "./screens/profiles/profile-list/ProfileListScreen";
import { SnapshotListScreen } from "./screens/snapshots/snapshot-list/SnapshotListScreen";
import { ViceArgumentEditScreen } from "./screens/vice-arguments/vice-argument-edit/ViceArgumentEditScreen";
import { ViceArgumentListScreen } from "./screens/vice-arguments/vice-argument-list/ViceArgumentListScreen";
import { StoreProvider } from "./store/StoreContext";

function AppScreens() {
  const { currentScreen, currentParams } = useRouter();
  if (currentScreen === "carousel") {
    return <GameCarouselScreen compilationId={currentParams.compilationId} />;
  }
  if (currentScreen === "game-details") {
    return <GameDetailsScreen gameId={currentParams.gameId ?? "game-bubble"} />;
  }
  if (currentScreen === "game-management") {
    return (
      <GameManagementScreen gameId={currentParams.gameId ?? "game-bubble"} />
    );
  }
  if (currentScreen === "snapshot-list") {
    return (
      <SnapshotListScreen
        gameId={currentParams.gameId ?? "game-bubble"}
        mode={currentParams.mode === "launch" ? "launch" : "manage"}
      />
    );
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
  if (currentScreen === "key-mapping-list") {
    return (
      <KeyMappingListScreen
        ownerId={currentParams.ownerId ?? "profile-default"}
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
        ownerId={currentParams.ownerId ?? "profile-default"}
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
  if (currentScreen === "controller-family-assignment") {
    return (
      <ControllerFamilyAssignmentScreen
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
  if (currentScreen === "import-games") {
    return <ImportGamesScreen />;
  }
  if (currentScreen === "import-discovery") {
    return <ImportDiscoveryScreen />;
  }
  if (currentScreen === "import-candidate") {
    return <ImportCandidateScreen />;
  }
  if (currentScreen === "game-details-edit") {
    return (
      <GameDetailsEditScreen
        gameId={currentParams.gameId ?? "game-bubble"}
        importMode={currentParams.importMode === "true"}
        importTitle={currentParams.importTitle}
      />
    );
  }
  if (currentScreen === "game-rom-list") {
    return (
      <GameRomListScreen
        gameId={currentParams.gameId ?? "game-bubble"}
        statusMessage={currentParams.statusMessage}
      />
    );
  }
  if (currentScreen === "game-rom-add") {
    return <GameRomAddScreen gameId={currentParams.gameId ?? "game-bubble"} />;
  }
  if (currentScreen === "game-rom-edit") {
    return (
      <GameRomEditScreen
        gameId={currentParams.gameId ?? "game-bubble"}
        romId={currentParams.romId ?? ""}
      />
    );
  }
  if (currentScreen === "game-cover-art") {
    return (
      <CoverArtScreen
        gameId={currentParams.gameId ?? "game-bubble"}
        importMode={currentParams.importMode === "true"}
        importTitle={currentParams.importTitle}
      />
    );
  }
  if (currentScreen === "game-screenshots") {
    return (
      <ScreenshotsScreen
        gameId={currentParams.gameId ?? "game-bubble"}
        importMode={currentParams.importMode === "true"}
        importTitle={currentParams.importTitle}
      />
    );
  }
  if (currentScreen === "game-media-edit") {
    return (
      <GameMediaEditScreen
        gameId={currentParams.gameId ?? "game-bubble"}
        mediaSlot={currentParams.mediaSlot ?? "cover-thumbnail"}
        importMode={currentParams.importMode === "true"}
        importTitle={currentParams.importTitle}
        catalogueName={currentParams.catalogueName}
        entryId={currentParams.entryId}
      />
    );
  }
  if (currentScreen === "import-controls") {
    return <Placeholder name="Import Controls" />;
  }
  if (currentScreen === "get-from-catalogue") {
    return <Placeholder name="Get from Catalogue" />;
  }
  if (currentScreen === "get-from-url") {
    return <Placeholder name="Get from URL" />;
  }
  if (currentScreen === "get-from-file") {
    return <Placeholder name="Get from File" />;
  }
  if (currentScreen === "game-control-list") {
    return <Placeholder name="Game Control List" />;
  }
  if (currentScreen === "game-profiles-selection") {
    return <Placeholder name="Game Profiles Selection" />;
  }
  if (currentScreen === "audit") {
    return <Placeholder name="Audit" />;
  }
  if (currentScreen === "load64-catalogue-update") {
    return <Load64CatalogueUpdateScreen />;
  }
  if (currentScreen === "now-playing") {
    return <NowPlayingScreen gameId={currentParams.gameId ?? "game-bubble"} />;
  }
  if (currentScreen === "now-playing-swap-disks") {
    return (
      <NowPlayingSwapDisksScreen
        gameId={currentParams.gameId ?? "game-bubble"}
      />
    );
  }
  if (currentScreen === "now-playing-take-screenshot") {
    return (
      <NowPlayingTakeScreenshotScreen
        gameId={currentParams.gameId ?? "game-bubble"}
      />
    );
  }
  if (currentScreen === "now-playing-take-snapshot") {
    return (
      <NowPlayingTakeSnapshotScreen
        gameId={currentParams.gameId ?? "game-bubble"}
      />
    );
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
