import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { GameRom } from "./types";
import { renumber, wrapIndex } from "./utils";
import "./index.css";

type FocusRegion = "list" | "topbar";
type TopBarCta = "add" | "back";
type Overlay = "context-menu" | "reorder" | "remove";

const TOP_BAR_CTAS: TopBarCta[] = ["add", "back"];
const CONTEXT_MENU_ITEMS = ["Reorder", "Remove"] as const;
const CONFIRM_OPTIONS = ["Yes", "No"] as const;

interface GameRomListScreenProps {
  gameId: string;
  statusMessage?: string;
}

export function GameRomListScreen({
  gameId,
  statusMessage: initialStatusMessage = "",
}: GameRomListScreenProps) {
  const { pop, pushFrom, currentParams } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const roms = store.gameRomList.roms[gameId] ?? [];

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const saved = Number(currentParams.selectedIndex);
    return Number.isFinite(saved) && saved >= 0 ? saved : 0;
  });
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("add");
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [overlayIndex, setOverlayIndex] = useState(0);
  const [reorderOriginIndex, setReorderOriginIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState(initialStatusMessage);

  const containerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLAnchorElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);

  const safeSelectedIndex =
    roms.length > 0 ? Math.min(selectedIndex, roms.length - 1) : 0;
  const focusedRom = roms[safeSelectedIndex];

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
      if (overlay === "reorder") {
        handleReorderKey(event);
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
    if (event.key === "ArrowDown") {
      setSelectedIndex((prev) => wrapIndex(prev, 1, roms.length));
      setStatusMessage("");
    } else if (event.key === "ArrowUp") {
      setSelectedIndex((prev) => wrapIndex(prev, -1, roms.length));
      setStatusMessage("");
    } else if (event.key === "Enter") {
      if (focusedRom) navigateToEdit(focusedRom);
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
      if (action === "Reorder") {
        setOverlay("reorder");
        setReorderOriginIndex(safeSelectedIndex);
      } else {
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

  function handleReorderKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      moveSelectedRom(1);
    } else if (event.key === "ArrowUp") {
      moveSelectedRom(-1);
    } else if (event.key === "Enter") {
      setOverlay(null);
    } else if (event.key === "Escape") {
      cancelReorder();
    }
  }

  function cancelReorder() {
    setStore((prev) => {
      const currentRoms = prev.gameRomList.roms[gameId] ?? [];
      if (safeSelectedIndex === reorderOriginIndex) return prev;
      const reordered = [...currentRoms];
      const [moved] = reordered.splice(safeSelectedIndex, 1);
      reordered.splice(reorderOriginIndex, 0, moved);
      return {
        ...prev,
        gameRomList: {
          ...prev.gameRomList,
          roms: {
            ...prev.gameRomList.roms,
            [gameId]: renumber(reordered),
          },
        },
      };
    });
    setSelectedIndex(reorderOriginIndex);
    setOverlay(null);
  }

  function moveSelectedRom(delta: number) {
    setStore((prev) => {
      const currentRoms = prev.gameRomList.roms[gameId] ?? [];
      if (currentRoms.length < 2) return prev;
      const newIndex = wrapIndex(safeSelectedIndex, delta, currentRoms.length);
      const reordered = [...currentRoms];
      const [moved] = reordered.splice(safeSelectedIndex, 1);
      reordered.splice(newIndex, 0, moved);
      return {
        ...prev,
        gameRomList: {
          ...prev.gameRomList,
          roms: {
            ...prev.gameRomList.roms,
            [gameId]: renumber(reordered),
          },
        },
      };
    });
    setSelectedIndex((prev) => wrapIndex(prev, delta, roms.length));
  }

  function navigateToAdd() {
    pushFrom({ selectedIndex: String(safeSelectedIndex) }, "game-rom-add", {
      gameId,
    });
  }

  function navigateToEdit(rom: GameRom) {
    pushFrom({ selectedIndex: String(safeSelectedIndex) }, "game-rom-edit", {
      gameId,
      romId: rom.id,
    });
  }

  function openContextMenu() {
    if (!focusedRom) return;
    setOverlay("context-menu");
    setOverlayIndex(0);
  }

  function confirmRemove() {
    if (!focusedRom) return;
    const removedLabel = focusedRom.label;
    setStore((prev) => {
      const currentRoms = prev.gameRomList.roms[gameId] ?? [];
      const filtered = currentRoms.filter((r) => r.id !== focusedRom.id);
      return {
        ...prev,
        gameRomList: {
          ...prev.gameRomList,
          roms: {
            ...prev.gameRomList.roms,
            [gameId]: renumber(filtered),
          },
        },
      };
    });
    setSelectedIndex((prev) => Math.max(0, prev - 1));
    setOverlay(null);
    setStatusMessage(`${removedLabel} removed`);
    containerRef.current?.focus();
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "list") {
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
        setFocusRegion("list");
        containerRef.current?.focus();
      }
    }
  }

  function focusCtaButton(cta: TopBarCta) {
    if (cta === "add") {
      addButtonRef.current?.focus();
    } else {
      backButtonRef.current?.focus();
    }
  }

  function ctaClassName(cta: TopBarCta): string {
    const focused = focusRegion === "topbar" && focusedCta === cta;
    return `topbar-cta topbar-cta--nav${focused ? " topbar-cta--focused" : ""}`;
  }

  const screenTitle = game ? `${game.title} > ROMs` : "ROMs";

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">ROMs</span>
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
        if (roms.length > 0) openContextMenu();
      }}
    >
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
        <div className="screen__topbar-ctas">
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
        {roms.length === 0 ? (
          <p className="game-rom-list__empty">Select Add to add a ROM file.</p>
        ) : (
          <>
            <div className="list__header" style={{ display: "flex" }}>
              <span className="game-rom-list__col-pos">#</span>
              <span className="game-rom-list__col-label">Label</span>
              <span className="game-rom-list__col-filename">Filename</span>
            </div>
            <ul className="list">
              {roms.map((rom, index) => (
                <li
                  key={rom.id}
                  className={buildRowClassName(
                    index === safeSelectedIndex && focusRegion === "list",
                    overlay === "reorder" && index === safeSelectedIndex,
                  )}
                  style={{ display: "flex" }}
                  onClick={() => {
                    setSelectedIndex(index);
                    navigateToEdit(rom);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSelectedIndex(index);
                      navigateToEdit(rom);
                    }
                  }}
                >
                  <span className="game-rom-list__col-pos">{rom.position}</span>
                  <span className="game-rom-list__col-label">{rom.label}</span>
                  <span className="game-rom-list__col-filename">
                    {rom.filename}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="screen__bottombar">{statusMessage}</div>
      {overlay === "context-menu" && focusedRom && (
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
      {overlay === "remove" && focusedRom && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">Remove {focusedRom.label}?</div>
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

function buildRowClassName(isSelected: boolean, isReordering: boolean): string {
  const parts = ["list__row"];
  if (isSelected) parts.push("list__row--selected");
  if (isReordering) parts.push("game-rom-list__row--reordering");
  return parts.join(" ");
}
