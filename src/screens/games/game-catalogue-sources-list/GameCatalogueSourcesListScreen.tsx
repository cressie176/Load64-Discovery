import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "list" | "topbar";
type TopBarCta = "add" | "back";
type Overlay = "context-menu" | "remove";

const CONFIRM_OPTIONS = ["Yes", "No"] as const;
const CONTEXT_MENU_ITEMS = ["Fetch", "Remove"] as const;
const SUPPORTED_CATALOGUES = ["GameBase64", "MobyGames"];

function wrapIndex(index: number, delta: number, length: number): number {
  return (index + delta + length) % length;
}

interface GameCatalogueSourcesListScreenProps {
  gameId: string;
  importMode?: boolean;
  importTitle?: string;
}

export function GameCatalogueSourcesListScreen({
  gameId,
  importMode = false,
  importTitle,
}: GameCatalogueSourcesListScreenProps) {
  const { pop, push } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const sources = game
    ? [...game.sources].sort((a, b) =>
        a.catalogueName.localeCompare(b.catalogueName),
      )
    : [];

  const allLinked = sources.length >= SUPPORTED_CATALOGUES.length;
  const topBarCtas: TopBarCta[] = allLinked ? ["back"] : ["add", "back"];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("add");
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [overlayIndex, setOverlayIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLAnchorElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);

  const safeSelectedIndex =
    sources.length > 0 ? Math.min(selectedIndex, sources.length - 1) : 0;
  const focusedSource = sources[safeSelectedIndex];

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (overlay === "context-menu") {
        handleContextMenuKey(event);
        return;
      }
      if (overlay === "remove") {
        handleRemoveOverlayKey(event);
        return;
      }
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
    if (event.key === "Escape") {
      pop();
      return;
    }
    if (focusRegion === "topbar") {
      handleTopBarKey(event);
      return;
    }
    handleListKey(event);
  }

  function handleTopBarKey(event: KeyboardEvent) {
    if (event.key === "Enter") {
      if (focusedCta === "add") {
        navigateToAdd();
      } else {
        pop();
      }
    }
  }

  function handleListKey(event: KeyboardEvent) {
    if (sources.length === 0) return;
    if (event.key === "ArrowDown") {
      setSelectedIndex((prev) => wrapIndex(prev, 1, sources.length));
      setStatusMessage("");
    } else if (event.key === "ArrowUp") {
      setSelectedIndex((prev) => wrapIndex(prev, -1, sources.length));
      setStatusMessage("");
    } else if (event.key === "Enter") {
      navigateToGameInfoEdit(focusedSource);
    } else if (event.key === "Alt") {
      event.preventDefault();
      openContextMenu();
    }
  }

  function handleContextMenuKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setOverlayIndex((prev) => wrapIndex(prev, 1, CONTEXT_MENU_ITEMS.length));
    } else if (event.key === "ArrowUp") {
      setOverlayIndex((prev) => wrapIndex(prev, -1, CONTEXT_MENU_ITEMS.length));
    } else if (event.key === "Enter") {
      const action = CONTEXT_MENU_ITEMS[overlayIndex];
      if (action === "Fetch") {
        setOverlay(null);
        navigateToGameInfoEdit(focusedSource);
      } else if (action === "Remove") {
        setOverlay("remove");
        setOverlayIndex(0);
      }
    } else if (event.key === "Escape") {
      setOverlay(null);
    }
  }

  function handleRemoveOverlayKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setOverlayIndex((prev) => wrapIndex(prev, 1, CONFIRM_OPTIONS.length));
    } else if (event.key === "ArrowUp") {
      setOverlayIndex((prev) => wrapIndex(prev, -1, CONFIRM_OPTIONS.length));
    } else if (event.key === "Enter") {
      if (overlayIndex === 0) {
        confirmRemove();
      } else {
        setOverlay(null);
        containerRef.current?.focus();
      }
    } else if (event.key === "Escape") {
      setOverlay(null);
      containerRef.current?.focus();
    }
  }

  function navigateToAdd() {
    push("game-add-catalogue-source", {
      gameId,
      ...(importMode && { importMode: "true", importTitle: importTitle ?? "" }),
    });
  }

  function navigateToGameInfoEdit(source: typeof focusedSource) {
    if (!source) return;
    push("game-details-edit", {
      gameId,
      catalogueName: source.catalogueName,
      entryId: source.entryId,
      importMode: "true",
    });
  }

  function openContextMenu() {
    if (!focusedSource) return;
    setOverlay("context-menu");
    setOverlayIndex(0);
  }

  function confirmRemove() {
    if (!focusedSource) return;
    const removedSource = `${focusedSource.catalogueName}: ${focusedSource.entryId}`;
    setStore((prev) => ({
      ...prev,
      gameDetails: {
        ...prev.gameDetails,
        games: prev.gameDetails.games.map((g) =>
          g.id === gameId
            ? {
                ...g,
                sources: g.sources.filter(
                  (s) =>
                    !(
                      s.catalogueName === focusedSource.catalogueName &&
                      s.entryId === focusedSource.entryId
                    ),
                ),
              }
            : g,
        ),
      },
    }));
    const newSources = sources.filter(
      (s) =>
        !(
          s.catalogueName === focusedSource.catalogueName &&
          s.entryId === focusedSource.entryId
        ),
    );
    setSelectedIndex(
      Math.min(safeSelectedIndex, Math.max(0, newSources.length - 1)),
    );
    setOverlay(null);
    setStatusMessage(`${removedSource} removed`);
    containerRef.current?.focus();
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "list") {
      const cta = reverse ? topBarCtas[topBarCtas.length - 1] : topBarCtas[0];
      setFocusRegion("topbar");
      setFocusedCta(cta as TopBarCta);
      focusCtaButton(cta as TopBarCta);
    } else {
      const currentIndex = topBarCtas.indexOf(focusedCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < topBarCtas.length) {
        const nextCta = topBarCtas[nextIndex] as TopBarCta;
        setFocusedCta(nextCta);
        focusCtaButton(nextCta);
      } else {
        setFocusRegion("list");
        containerRef.current?.focus();
      }
    }
  }

  function focusCtaButton(cta: TopBarCta) {
    if (cta === "add") addButtonRef.current?.focus();
    else backButtonRef.current?.focus();
  }

  function ctaClassName(cta: TopBarCta): string {
    const focused = focusRegion === "topbar" && focusedCta === cta;
    return `topbar-cta topbar-cta--nav${focused ? " topbar-cta--focused" : ""}`;
  }

  const screenTitle = deriveTitle(
    game?.title ?? "Game",
    importMode,
    importTitle ?? null,
  );

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">Sources</span>
          <div className="screen__topbar-ctas">
            <a
              ref={backButtonRef}
              href="#"
              className="topbar-cta topbar-cta--nav topbar-cta--focused"
              onClick={(e) => {
                e.preventDefault();
                pop();
              }}
            >
              Back
            </a>
          </div>
        </div>
        <div className="screen__content screen__content--empty">
          Game not found.
        </div>
        <div className="screen__bottombar" />
      </div>
    );
  }

  return (
    <div
      role="application"
      className="screen"
      ref={containerRef}
      tabIndex={-1}
      onContextMenu={(e) => {
        e.preventDefault();
        if (sources.length > 0) openContextMenu();
      }}
    >
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
        <div className="screen__topbar-ctas">
          {!allLinked && (
            <a
              ref={addButtonRef}
              href="#"
              className={ctaClassName("add")}
              onClick={(e) => {
                e.preventDefault();
                navigateToAdd();
              }}
            >
              Add
            </a>
          )}
          <a
            ref={backButtonRef}
            href="#"
            className={ctaClassName("back")}
            onClick={(e) => {
              e.preventDefault();
              pop();
            }}
          >
            Back
          </a>
        </div>
      </div>
      <div className="screen__content">
        {sources.length === 0 ? (
          <p className="catalogue-sources-list__empty">
            Add a source to import metadata and media.
          </p>
        ) : (
          <ul className="list">
            {sources.map((source, index) => (
              <li
                key={`${source.catalogueName}-${source.entryId}`}
                className={`list__row${index === safeSelectedIndex && focusRegion === "list" ? " list__row--selected" : ""}`}
                onClick={() => {
                  setSelectedIndex(index);
                  navigateToGameInfoEdit(source);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSelectedIndex(index);
                    navigateToGameInfoEdit(source);
                  }
                }}
              >
                {source.catalogueName}: {source.entryId}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="screen__bottombar">
        {statusMessage ||
          (allLinked
            ? `${game.title} is linked to all supported catalogues.`
            : "")}
      </div>
      {overlay === "context-menu" && focusedSource && (
        <div
          className="overlay-backdrop"
          style={{ alignItems: "flex-start", paddingTop: "80px" }}
        >
          <div className="overlay">
            <ul className="overlay__list">
              {CONTEXT_MENU_ITEMS.map((item, index) => (
                <li
                  key={item}
                  className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {overlay === "remove" && focusedSource && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">
              Remove {focusedSource.catalogueName}: {focusedSource.entryId}?
            </div>
            <ul className="overlay__list">
              {CONFIRM_OPTIONS.map((option, index) => (
                <li
                  key={option}
                  className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                >
                  {option}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function deriveTitle(
  gameTitle: string,
  importMode: boolean,
  importTitle: string | null,
): string {
  const base = importMode
    ? `Import Games > ${importTitle ?? gameTitle} > Sources`
    : `${gameTitle} > Sources`;
  return base;
}
