import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import {
  GAME_MANAGEMENT_ITEMS,
  GAME_MANAGEMENT_ROWS,
  type GameManagementItem,
  wrapIndex,
} from "./items";
import "./index.css";

type FocusRegion = "list" | "topbar" | "overlay";
type TopBarCta = "back";

const TOP_BAR_CTAS: TopBarCta[] = ["back"];

interface GameManagementScreenProps {
  gameId: string;
}

export function GameManagementScreen({ gameId }: GameManagementScreenProps) {
  const { pop, push, replace } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("back");
  const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const deleteInputRef = useRef<HTMLInputElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (focusRegion === "overlay") {
        handleOverlayKey(event);
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
      pop();
    }
  }

  function handleListKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setSelectedIndex((prev) =>
        wrapIndex(prev, 1, GAME_MANAGEMENT_ITEMS.length),
      );
    } else if (event.key === "ArrowUp") {
      setSelectedIndex((prev) =>
        wrapIndex(prev, -1, GAME_MANAGEMENT_ITEMS.length),
      );
    } else if (event.key === "Enter") {
      activateItem(GAME_MANAGEMENT_ITEMS[selectedIndex]);
    }
  }

  function handleOverlayKey(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeDeleteOverlay();
      return;
    }
    if (event.key === "Enter") {
      if (isDeleteConfirmed()) {
        confirmDelete();
      }
    }
  }

  function activateItem(item: GameManagementItem | undefined) {
    if (!item) return;
    if (item.action === "delete-game") {
      openDeleteOverlay();
      return;
    }
    const params: Record<string, string> = { gameId };
    if (item.mediaSlot) {
      params.mediaSlot = item.mediaSlot;
    }
    if (item.screen === "controller-selection") {
      params.ownerType = "game";
      if (game?.title) params.ownerName = game.title;
    }
    pushFrom({ selectedIndex: String(selectedIndex) }, item.screen, params);
  }

  function pushFrom(
    saved: Record<string, string>,
    screen: Parameters<typeof push>[0],
    params?: Record<string, string>,
  ) {
    push(screen, { ...saved, ...params });
  }

  function openDeleteOverlay() {
    setDeleteInput("");
    setShowDeleteOverlay(true);
    setFocusRegion("overlay");
    setTimeout(() => deleteInputRef.current?.focus(), 0);
  }

  function closeDeleteOverlay() {
    setShowDeleteOverlay(false);
    setFocusRegion("list");
    containerRef.current?.focus();
  }

  function isDeleteConfirmed(): boolean {
    if (!game) return false;
    return deleteInput.trim().toLowerCase() === game.title.toLowerCase();
  }

  function confirmDelete() {
    if (!game || !isDeleteConfirmed()) return;
    setStore((prev) => ({
      ...prev,
      gameDetails: {
        ...prev.gameDetails,
        games: prev.gameDetails.games.filter((g) => g.id !== gameId),
      },
      carousel: {
        ...prev.carousel,
        games: prev.carousel.games.filter((g) => g.id !== gameId),
      },
    }));
    replace("carousel");
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
    if (cta === "back") {
      backButtonRef.current?.focus();
    }
  }

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">Game Management</span>
          <div className="screen__topbar-ctas">
            <button
              ref={backButtonRef}
              className="topbar-cta topbar-cta--focused"
              onClick={pop}
              type="button"
            >
              [Back]
            </button>
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
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{game.title}</span>
        <div className="screen__topbar-ctas">
          <button
            ref={backButtonRef}
            className={`topbar-cta${focusRegion === "topbar" && focusedCta === "back" ? " topbar-cta--focused" : ""}`}
            onClick={pop}
            type="button"
          >
            [Back]
          </button>
        </div>
      </div>
      <div className="screen__content">
        <ul className="list">
          {GAME_MANAGEMENT_ROWS.map((row) => {
            if (row.kind === "group-header") {
              return (
                <li className="list__group-header" key={row.label}>
                  {row.label}
                </li>
              );
            }
            const itemIndex = GAME_MANAGEMENT_ITEMS.indexOf(row.item);
            return (
              <li
                key={row.item.label}
                className={`list__row${itemIndex === selectedIndex && focusRegion === "list" ? " list__row--selected" : ""}`}
                onClick={() => {
                  setSelectedIndex(itemIndex);
                  activateItem(row.item);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSelectedIndex(itemIndex);
                    activateItem(row.item);
                  }
                }}
              >
                {row.item.label}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="screen__bottombar" />
      {showDeleteOverlay && (
        <div className="overlay-backdrop">
          <div className="game-management-delete">
            <div className="game-management-delete__title">
              Delete {game.title}?
            </div>
            <p className="game-management-delete__body">
              This will permanently delete the game directory and all its files
              from disk.
            </p>
            <p className="game-management-delete__prompt">
              Type the game title to confirm:
            </p>
            <input
              ref={deleteInputRef}
              className="game-management-delete__input"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isDeleteConfirmed()) {
                  e.stopPropagation();
                  confirmDelete();
                } else if (e.key === "Escape") {
                  e.stopPropagation();
                  closeDeleteOverlay();
                }
              }}
            />
            <div className="game-management-delete__actions">
              <button
                ref={deleteButtonRef}
                className="game-management-delete__btn game-management-delete__btn--delete"
                disabled={!isDeleteConfirmed()}
                onClick={confirmDelete}
                type="button"
              >
                [Delete]
              </button>
              <button
                ref={cancelButtonRef}
                className="game-management-delete__btn"
                onClick={closeDeleteOverlay}
                type="button"
              >
                [Cancel]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
