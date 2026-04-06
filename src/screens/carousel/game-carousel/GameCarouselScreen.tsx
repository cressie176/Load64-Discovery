import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { Game } from "./types";
import "./index.css";

type FocusRegion = "carousel" | "topbar";
type TopBarCta = "compilations" | "admin";

const TOP_BAR_CTAS: TopBarCta[] = ["compilations", "admin"];

// Minimum and maximum number of slots visible on each side of the selected item
const MIN_HALF = 1;
const MAX_HALF = 4;

// Cover dimensions at the base (offset 0) size
const BASE_COVER_WIDTH = 160;
const BASE_COVER_GAP = 24;

function wrapIndex(index: number, delta: number, length: number): number {
  return (index + delta + length) % length;
}

function sortGamesByTitle(games: Game[]): Game[] {
  return [...games].sort((a, b) => a.sortTitle.localeCompare(b.sortTitle));
}

function getGamesForCompilation(
  allGames: Game[],
  compilationId: string,
  compilationGameRefs: Array<{ compilationId: string; gameId: string }>,
  compilationKind?: string,
): Game[] {
  if (compilationKind === "all-games") {
    return sortGamesByTitle(allGames);
  }
  const ids = new Set(
    compilationGameRefs
      .filter((ref) => ref.compilationId === compilationId)
      .map((ref) => ref.gameId),
  );
  return sortGamesByTitle(allGames.filter((g) => ids.has(g.id)));
}

function getSectionStartIndex(games: Game[], letter: string): number {
  const lower = letter.toLowerCase();
  const index = games.findIndex((g) =>
    g.sortTitle.toLowerCase().startsWith(lower),
  );
  return index >= 0 ? index : -1;
}

function getSectionBoundary(
  games: Game[],
  currentIndex: number,
  direction: -1 | 1,
): number {
  if (games.length === 0) return 0;
  const currentChar = games[currentIndex]?.sortTitle[0]?.toLowerCase() ?? "";
  if (direction === 1) {
    // jump to next section start
    const next = games.findIndex(
      (g, i) =>
        i > currentIndex && g.sortTitle[0]?.toLowerCase() !== currentChar,
    );
    return next >= 0 ? next : currentIndex;
  }
  // jump to previous section start
  let i = currentIndex - 1;
  while (i > 0 && games[i]?.sortTitle[0]?.toLowerCase() === currentChar) {
    i--;
  }
  // now find start of that section
  const prevChar = games[i]?.sortTitle[0]?.toLowerCase() ?? "";
  while (i > 0 && games[i - 1]?.sortTitle[0]?.toLowerCase() === prevChar) {
    i--;
  }
  return i >= 0 ? i : 0;
}

function buildLaunchActions(game: Game): string {
  if (!game.launchable) return game.blockingReason ?? "Unlaunchable";
  const actions: string[] = [];
  if (game.hasQuickstart) actions.push("Quickstart (X | Alt+Enter)");
  if (game.hasRom) actions.push("Load (B | CTRL+Enter)");
  if (game.hasSave) actions.push("Continue (Y | Shift+Enter)");
  return actions.join(" ◆ ");
}

function buildStatusMessage(game: Game | undefined): string {
  if (!game) return "";
  return buildLaunchActions(game);
}

function buildBlockedMessage(game: Game | undefined, action: string): string {
  if (!game) return "";
  return action;
}

function computeHalf(containerWidth: number): number {
  // Each side slot needs approximately BASE_COVER_WIDTH + BASE_COVER_GAP pixels
  // (with shrinkage applied, slots get smaller, but we reserve full-size space)
  const sideSlotWidth = BASE_COVER_WIDTH + BASE_COVER_GAP;
  const availableForSides = (containerWidth - BASE_COVER_WIDTH) / 2;
  const half = Math.floor(availableForSides / sideSlotWidth);
  return Math.max(MIN_HALF, Math.min(MAX_HALF, half));
}

function buildGameInfoLine(game: Game | undefined): string {
  if (!game) return "";
  const parts = [game.title];
  if (game.publisher) parts.push(game.publisher);
  if (game.year) parts.push(String(game.year));
  return parts.join(" - ");
}

interface GameCarouselScreenProps {
  compilationId?: string;
}

export function GameCarouselScreen({ compilationId }: GameCarouselScreenProps) {
  const { push } = useRouter();
  const { store, setStore } = useStore();

  const allGames = store.carousel.games;
  const compilations = store.compilations.compilations;
  const compilationGameRefs = store.compilations.compilationGameRefs;

  const effectiveCompilationId =
    compilationId ?? store.carousel.activeCompilationId;

  const activeCompilation = compilations.find(
    (c) => c.id === effectiveCompilationId,
  );

  const games = getGamesForCompilation(
    allGames,
    effectiveCompilationId,
    compilationGameRefs,
    activeCompilation?.kind,
  );

  const savedPosition =
    store.carousel.compilationPositions[effectiveCompilationId] ?? 0;

  const [selectedIndex, setSelectedIndex] = useState(
    Math.min(savedPosition, Math.max(0, games.length - 1)),
  );
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("carousel");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("compilations");
  const [statusMessage, setStatusMessage] = useState<string>(() =>
    buildStatusMessage(
      games[Math.min(savedPosition, Math.max(0, games.length - 1))],
    ),
  );
  const [half, setHalf] = useState(MIN_HALF);

  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const compilationsButtonRef = useRef<HTMLAnchorElement>(null);
  const adminButtonRef = useRef<HTMLAnchorElement>(null);

  const safeSelectedIndex =
    games.length > 0 ? Math.min(selectedIndex, games.length - 1) : 0;
  const selectedGame = games[safeSelectedIndex];

  const updateHalf = useCallback(() => {
    if (carouselRef.current) {
      setHalf(computeHalf(carouselRef.current.offsetWidth));
    }
  }, []);

  // Save position and update active compilation when compilationId changes
  useEffect(() => {
    setStore((prev) => ({
      ...prev,
      carousel: {
        ...prev.carousel,
        activeCompilationId: effectiveCompilationId,
      },
    }));
  }, [effectiveCompilationId, setStore]);

  // Save position when index changes
  useEffect(() => {
    setStore((prev) => ({
      ...prev,
      carousel: {
        ...prev.carousel,
        compilationPositions: {
          ...prev.carousel.compilationPositions,
          [effectiveCompilationId]: safeSelectedIndex,
        },
      },
    }));
  }, [safeSelectedIndex, effectiveCompilationId, setStore]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    setStatusMessage(buildStatusMessage(selectedGame));
  }, [selectedGame]);

  useEffect(() => {
    updateHalf();
    const observer = new ResizeObserver(updateHalf);
    if (carouselRef.current) observer.observe(carouselRef.current);
    return () => observer.disconnect();
  }, [updateHalf]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleMainKey(event);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleMainKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      toggleFocusRegion(event.shiftKey);
      return;
    }
    // Escape does nothing — this is the root screen
    if (event.key === "Escape") {
      return;
    }
    if (focusRegion === "topbar") {
      handleTopBarKey(event);
      return;
    }
    handleCarouselKey(event);
  }

  function handleTopBarKey(event: KeyboardEvent) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const delta = event.key === "ArrowLeft" ? -1 : 1;
      const currentIndex = TOP_BAR_CTAS.indexOf(focusedCta);
      const nextIndex = wrapIndex(currentIndex, delta, TOP_BAR_CTAS.length);
      const nextCta = TOP_BAR_CTAS[nextIndex] as TopBarCta;
      setFocusedCta(nextCta);
      focusCtaButton(nextCta);
    } else if (event.key === "Enter") {
      if (focusedCta === "compilations") {
        navigateToCompilations();
      } else {
        navigateToAdmin();
      }
    }
  }

  function handleCarouselKey(event: KeyboardEvent) {
    if (games.length === 0) return;

    if (event.key === "ArrowLeft") {
      navigate(-1);
    } else if (event.key === "ArrowRight") {
      navigate(1);
    } else if (event.key === "PageUp") {
      jumpSection(-1);
    } else if (event.key === "PageDown") {
      jumpSection(1);
    } else if (event.key === "Enter") {
      if (event.altKey) {
        handleQuickstart();
      } else if (event.ctrlKey) {
        handleLoadRom();
      } else if (event.shiftKey) {
        handleContinue();
      } else {
        openGameDetails();
      }
    } else if (/^[a-z0-9]$/i.test(event.key) && event.key.length === 1) {
      jumpToLetter(event.key);
    }
  }

  function navigate(delta: -1 | 1) {
    setSelectedIndex((prev) => wrapIndex(prev, delta, games.length));
  }

  function jumpSection(direction: -1 | 1) {
    const next = getSectionBoundary(games, safeSelectedIndex, direction);
    setSelectedIndex(next);
  }

  function jumpToLetter(letter: string) {
    const index = getSectionStartIndex(games, letter);
    if (index >= 0) {
      setSelectedIndex(index);
    }
  }

  function openGameDetails() {
    if (!selectedGame) return;
    push("game-details", { gameId: selectedGame.id });
  }

  function handleQuickstart() {
    if (!selectedGame) return;
    if (!selectedGame.launchable) {
      setStatusMessage(
        buildBlockedMessage(
          selectedGame,
          selectedGame.blockingReason ?? "Unlaunchable",
        ),
      );
      return;
    }
    if (!selectedGame.hasQuickstart) {
      setStatusMessage(
        buildBlockedMessage(selectedGame, "No quickstart snapshot available"),
      );
      return;
    }
    push("now-playing", { gameId: selectedGame.id });
  }

  function handleLoadRom() {
    if (!selectedGame) return;
    if (!selectedGame.launchable) {
      setStatusMessage(
        buildBlockedMessage(
          selectedGame,
          selectedGame.blockingReason ?? "Unlaunchable",
        ),
      );
      return;
    }
    if (!selectedGame.hasRom) {
      setStatusMessage(buildBlockedMessage(selectedGame, "No ROM configured"));
      return;
    }
    push("now-playing", { gameId: selectedGame.id });
  }

  function handleContinue() {
    if (!selectedGame) return;
    if (!selectedGame.launchable) {
      setStatusMessage(
        buildBlockedMessage(
          selectedGame,
          selectedGame.blockingReason ?? "Unlaunchable",
        ),
      );
      return;
    }
    if (!selectedGame.hasSave) {
      setStatusMessage(
        buildBlockedMessage(selectedGame, "No save state available"),
      );
      return;
    }
    push("now-playing", { gameId: selectedGame.id });
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "carousel") {
      const cta = reverse
        ? TOP_BAR_CTAS[TOP_BAR_CTAS.length - 1]
        : TOP_BAR_CTAS[0];
      setFocusRegion("topbar");
      setFocusedCta(cta as TopBarCta);
      focusCtaButton(cta as TopBarCta);
    } else {
      const currentIndex = TOP_BAR_CTAS.indexOf(focusedCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < TOP_BAR_CTAS.length) {
        const nextCta = TOP_BAR_CTAS[nextIndex] as TopBarCta;
        setFocusedCta(nextCta);
        focusCtaButton(nextCta);
      } else {
        setFocusRegion("carousel");
        containerRef.current?.focus();
      }
    }
  }

  function focusCtaButton(cta: TopBarCta) {
    if (cta === "compilations") {
      compilationsButtonRef.current?.focus();
    } else {
      adminButtonRef.current?.focus();
    }
  }

  function navigateToCompilations() {
    push("compilation-list", { mode: "browse" });
  }

  function navigateToAdmin() {
    push("admin-hub");
  }

  // Build the visible slice of games for the carousel (wrapping)
  function getVisibleItems(): Array<{ game: Game; offset: number }> {
    if (games.length === 0) return [];
    const items: Array<{ game: Game; offset: number }> = [];
    for (let offset = -half; offset <= half; offset++) {
      const index = wrapIndex(safeSelectedIndex + offset, 0, games.length);
      const game = games[index];
      if (game) {
        items.push({ game, offset });
      }
    }
    return items;
  }

  function itemClassName(offset: number): string {
    const absOffset = Math.abs(offset);
    const parts = ["carousel__item"];
    if (offset === 0) parts.push("carousel__item--selected");
    else if (absOffset === 1) parts.push("carousel__item--adjacent");
    else parts.push("carousel__item--far");
    if (offset === 0 && selectedGame && !selectedGame.launchable) {
      parts.push("carousel__item--unlaunchable");
    }
    return parts.join(" ");
  }

  const compilationName = activeCompilation?.name ?? "Games";
  const gameInfoLine = buildGameInfoLine(selectedGame);

  return (
    <div role="application" className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{compilationName}</span>
        <div className="screen__topbar-ctas">
          <a
            ref={compilationsButtonRef}
            href="#"
            className={`topbar-cta topbar-cta--nav${focusRegion === "topbar" && focusedCta === "compilations" ? " topbar-cta--focused" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              navigateToCompilations();
            }}
          >
            Compilations
          </a>
          <a
            ref={adminButtonRef}
            href="#"
            className={`topbar-cta topbar-cta--nav${focusRegion === "topbar" && focusedCta === "admin" ? " topbar-cta--focused" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              navigateToAdmin();
            }}
          >
            Admin
          </a>
        </div>
      </div>
      {allGames.length === 0 ? (
        <div className="screen__content screen__content--empty">
          No games in your library. Select Admin to import games.
        </div>
      ) : games.length === 0 ? (
        <div className="screen__content screen__content--empty">
          No games in this compilation. Select Compilations to switch
          compilation.
        </div>
      ) : (
        <div className="carousel" ref={carouselRef}>
          <div className="carousel__track">
            {getVisibleItems().map(({ game, offset }) => (
              <div
                key={offset}
                className={itemClassName(offset)}
                style={{ "--offset": Math.abs(offset) } as React.CSSProperties}
              >
                <div className="carousel__item-wrapper">
                  {game.coverUrl ? (
                    <img
                      src={game.coverUrl}
                      alt={game.title}
                      className="carousel__cover"
                    />
                  ) : (
                    <div className="carousel__cover-placeholder">
                      {game.title}
                    </div>
                  )}
                  {offset === 0 && !game.launchable && (
                    <div className="carousel__out-of-order">
                      <span className="carousel__out-of-order-label">
                        Out of Order
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="carousel__game-info">{gameInfoLine}</div>
        </div>
      )}
      <div className="screen__bottombar">{statusMessage}</div>
    </div>
  );
}
