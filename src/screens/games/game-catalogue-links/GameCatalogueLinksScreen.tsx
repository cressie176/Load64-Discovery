import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "list" | "topbar";
type TopBarCta = "add" | "next" | "back";
type Overlay = "context-menu" | "remove";

const CONFIRM_OPTIONS = ["Yes", "No"] as const;
const SUPPORTED_CATALOGUES = ["GameBase64", "MobyGames"];

function wrapIndex(index: number, delta: number, length: number): number {
  return (index + delta + length) % length;
}

function deriveTitle(
  gameTitle: string,
  importMode: boolean,
  importTitle: string | null,
): string {
  if (importMode) {
    return `Import Games > ${importTitle ?? gameTitle} > Catalogues`;
  }
  return `${gameTitle} > Catalogues`;
}

interface GameCatalogueLinksScreenProps {
  gameId: string;
  importMode?: boolean;
  importTitle?: string;
}

export function GameCatalogueLinksScreen({
  gameId,
  importMode = false,
  importTitle,
}: GameCatalogueLinksScreenProps) {
  const { pop, push, pushFrom, currentParams } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const links = game
    ? [...game.sources].sort((a, b) =>
        a.catalogueName.localeCompare(b.catalogueName),
      )
    : [];

  const allLinked = links.length >= SUPPORTED_CATALOGUES.length;

  const topBarCtas: TopBarCta[] = importMode
    ? allLinked
      ? ["next", "back"]
      : ["add", "next", "back"]
    : allLinked
      ? ["back"]
      : ["add", "back"];

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const saved = Number(currentParams.selectedIndex);
    return Number.isFinite(saved) && saved >= 0 ? saved : 0;
  });
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>(topBarCtas[0]);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [overlayIndex, setOverlayIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLAnchorElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);

  const safeSelectedIndex =
    links.length > 0 ? Math.min(selectedIndex, links.length - 1) : 0;
  const focusedLink = links[safeSelectedIndex];

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
      } else if (focusedCta === "next") {
        navigateToNext();
      } else {
        pop();
      }
    }
  }

  function handleListKey(event: KeyboardEvent) {
    if (links.length === 0) return;
    if (event.key === "ArrowDown") {
      setSelectedIndex((prev) => wrapIndex(prev, 1, links.length));
      setStatusMessage("");
    } else if (event.key === "ArrowUp") {
      setSelectedIndex((prev) => wrapIndex(prev, -1, links.length));
      setStatusMessage("");
    } else if (event.key === "Enter") {
      navigateToEdit(focusedLink);
    } else if (event.key === "Alt") {
      event.preventDefault();
      openContextMenu();
    }
  }

  function handleContextMenuKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setOverlayIndex(0);
    } else if (event.key === "ArrowUp") {
      setOverlayIndex(0);
    } else if (event.key === "Enter") {
      setOverlay("remove");
      setOverlayIndex(0);
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
    pushFrom(
      { selectedIndex: String(safeSelectedIndex) },
      "game-catalogue-link-add",
      {
        gameId,
        ...(importMode && {
          importMode: "true",
          importTitle: importTitle ?? "",
        }),
      },
    );
  }

  function navigateToEdit(link: typeof focusedLink) {
    if (!link) return;
    pushFrom(
      { selectedIndex: String(safeSelectedIndex) },
      "game-catalogue-link-edit",
      {
        gameId,
        catalogueName: link.catalogueName,
        ...(importMode && {
          importMode: "true",
          importTitle: importTitle ?? "",
        }),
      },
    );
  }

  function navigateToNext() {
    push("game-details-edit", {
      gameId,
      importMode: "true",
      ...(importTitle !== undefined ? { importTitle } : {}),
    });
  }

  function openContextMenu() {
    if (!focusedLink) return;
    setOverlay("context-menu");
    setOverlayIndex(0);
  }

  function confirmRemove() {
    if (!focusedLink) return;
    const removedName = focusedLink.catalogueName;
    setStore((prev) => ({
      ...prev,
      gameDetails: {
        ...prev.gameDetails,
        games: prev.gameDetails.games.map((g) =>
          g.id === gameId
            ? {
                ...g,
                sources: g.sources.filter(
                  (s) => s.catalogueName !== focusedLink.catalogueName,
                ),
              }
            : g,
        ),
      },
    }));
    const newLinks = links.filter(
      (s) => s.catalogueName !== focusedLink.catalogueName,
    );
    setSelectedIndex(
      Math.min(safeSelectedIndex, Math.max(0, newLinks.length - 1)),
    );
    setOverlay(null);
    setStatusMessage(`${removedName} removed`);
    containerRef.current?.focus();
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "list") {
      const cta = reverse ? topBarCtas[topBarCtas.length - 1] : topBarCtas[0];
      setFocusRegion("topbar");
      setFocusedCta(cta);
      focusCtaButton(cta);
    } else {
      const currentIndex = topBarCtas.indexOf(focusedCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < topBarCtas.length) {
        const nextCta = topBarCtas[nextIndex];
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
    else if (cta === "next") nextButtonRef.current?.focus();
    else backButtonRef.current?.focus();
  }

  function ctaNavClassName(cta: TopBarCta): string {
    const focused = focusRegion === "topbar" && focusedCta === cta;
    return `topbar-cta topbar-cta--nav${focused ? " topbar-cta--focused" : ""}`;
  }

  function ctaActionClassName(cta: TopBarCta): string {
    const focused = focusRegion === "topbar" && focusedCta === cta;
    return `topbar-cta topbar-cta--action${focused ? " topbar-cta--focused" : ""}`;
  }

  const screenTitle = deriveTitle(
    game?.title ?? "Game",
    importMode,
    importTitle ?? null,
  );

  const bottomBarMessage =
    statusMessage ||
    (allLinked
      ? `${game?.title ?? "Game"} is linked to all supported catalogues.`
      : "");

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">Catalogues</span>
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
        if (links.length > 0) openContextMenu();
      }}
    >
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
        <div className="screen__topbar-ctas">
          {topBarCtas.includes("add") && (
            <a
              ref={addButtonRef}
              href="#"
              className={ctaNavClassName("add")}
              onClick={(e) => {
                e.preventDefault();
                navigateToAdd();
              }}
            >
              Add
            </a>
          )}
          {topBarCtas.includes("next") && (
            <button
              ref={nextButtonRef}
              className={ctaActionClassName("next")}
              onClick={navigateToNext}
              type="button"
            >
              Next
            </button>
          )}
          <a
            ref={backButtonRef}
            href="#"
            className={ctaNavClassName("back")}
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
        {links.length === 0 ? (
          <p className="catalogue-links__empty">
            Link a catalogue to enable metadata and media fetch.
          </p>
        ) : (
          <ul className="list">
            <li className="list__header">
              <span className="catalogue-links__col catalogue-links__col--catalogue">
                Catalogue
              </span>
              <span className="catalogue-links__col catalogue-links__col--id">
                ID
              </span>
            </li>
            {links.map((link, index) => (
              <li
                key={link.catalogueName}
                className={`list__row catalogue-links__row${index === safeSelectedIndex && focusRegion === "list" ? " list__row--selected" : ""}`}
                onClick={() => {
                  setSelectedIndex(index);
                  navigateToEdit(link);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSelectedIndex(index);
                    navigateToEdit(link);
                  }
                }}
              >
                <span className="catalogue-links__col catalogue-links__col--catalogue">
                  {link.catalogueName}
                </span>
                <span className="catalogue-links__col catalogue-links__col--id">
                  {link.entryId}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="screen__bottombar">{bottomBarMessage}</div>
      {overlay === "context-menu" && focusedLink && (
        <div
          className="overlay-backdrop"
          style={{ alignItems: "flex-start", paddingTop: "80px" }}
        >
          <div className="overlay">
            <ul className="overlay__list">
              <li className="overlay__row overlay__row--selected">Remove</li>
            </ul>
          </div>
        </div>
      )}
      {overlay === "remove" && focusedLink && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">
              Remove {focusedLink.catalogueName}?
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
