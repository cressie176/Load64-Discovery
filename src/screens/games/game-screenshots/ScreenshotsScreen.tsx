import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { GameDetails } from "../game-details/types";
import type { MediaCandidate } from "../game-media-edit/types";
import "./index.css";

const MAX_CANDIDATES = 8;
const COLS = 3;
const DELETE_OPTIONS = ["Yes", "No"] as const;

type ScreenshotSlot = "loading" | "title" | "gameplay";
type FocusPanel = "slots" | "candidates" | "actions";
type Overlay = "context-menu" | "left-context-menu" | "left-confirm";

const SLOT_ORDER: ScreenshotSlot[] = ["loading", "title", "gameplay"];

export function deriveScreenTitle(
  importMode: boolean,
  gameTitle: string,
  importTitle?: string,
): string {
  if (importMode) {
    const title = importTitle ?? gameTitle;
    return `Import Games > ${title} > Screenshots`;
  }
  return `${gameTitle} > Screenshots`;
}

export function deriveSlotLabel(slot: ScreenshotSlot): string {
  switch (slot) {
    case "loading":
      return "Loading";
    case "title":
      return "Title";
    case "gameplay":
      return "Gameplay";
  }
}

export function deriveSlotDeleteLabel(slot: ScreenshotSlot): string {
  return `Delete ${deriveSlotLabel(slot)} image`;
}

export function deriveAssignedUrl(
  game: GameDetails,
  slot: ScreenshotSlot,
): string | undefined {
  return game.screenshots.find((s) => s.slot === slot)?.url;
}

function candidatesStoreKey(gameId: string): string {
  return `${gameId}-screenshots`;
}

function findNextInRow(
  current: number,
  delta: number,
  candidateCount: number,
): number {
  let next = current + delta;
  if (next < 0) next = 0;
  if (next >= candidateCount) next = candidateCount - 1;
  return next;
}

function findNextVertical(
  current: number,
  delta: number,
  candidateCount: number,
): number {
  const row = Math.floor(current / COLS);
  const col = current % COLS;
  const newRow = row + delta;
  const newIndex = newRow * COLS + col;
  if (newIndex < 0) return current;
  if (newIndex >= candidateCount) return current;
  return newIndex;
}

interface ScreenshotsScreenProps {
  gameId: string;
  importMode: boolean;
  importTitle?: string;
}

export function ScreenshotsScreen({
  gameId,
  importMode,
  importTitle,
}: ScreenshotsScreenProps) {
  const { pop, push, replace } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);

  const key = candidatesStoreKey(gameId);
  const storeCandidates = store.gameMediaEdit.candidates[key] ?? [];

  const [localCandidates, setLocalCandidates] = useState<MediaCandidate[]>([]);
  const consumedStoreCountRef = useRef(0);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [slotAssignments, setSlotAssignments] = useState<
    Partial<Record<ScreenshotSlot, string>>
  >({});
  const [deletedSlots, setDeletedSlots] = useState<Set<ScreenshotSlot>>(
    new Set(),
  );
  const [focusPanel, setFocusPanel] = useState<FocusPanel>("slots");
  const [focusedCandidateIndex, setFocusedCandidateIndex] = useState(0);
  const [focusedActionIndex, setFocusedActionIndex] = useState(0);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [overlayIndex, setOverlayIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const candidateCount = localCandidates.length;
  const sources = game?.sources ?? [];
  const currentSlot = SLOT_ORDER[currentSlotIndex] ?? "loading";

  useEffect(() => {
    const unconsumed = storeCandidates.slice(consumedStoreCountRef.current);
    if (unconsumed.length === 0) return;
    consumedStoreCountRef.current = storeCandidates.length;
    setLocalCandidates((prev) => {
      const updated = [...prev, ...unconsumed].slice(0, MAX_CANDIDATES);
      return updated;
    });
    setFocusPanel("actions");
    setFocusedActionIndex(0);
  }, [storeCandidates]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (overlay) {
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
      toggleFocusPanel(event.shiftKey);
      return;
    }
    if (event.key === "Escape") {
      handleCancel();
      return;
    }
    if (focusPanel === "slots") {
      handleSlotsKey(event);
    } else if (focusPanel === "candidates") {
      handleCandidatesKey(event);
    } else if (focusPanel === "actions") {
      handleActionsKey(event);
    }
  }

  function handleSlotsKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCurrentSlotIndex((prev) => Math.min(SLOT_ORDER.length - 1, prev + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCurrentSlotIndex((prev) => Math.max(0, prev - 1));
    } else if (event.key === "Alt") {
      event.preventDefault();
      const slot = SLOT_ORDER[currentSlotIndex];
      if (slot !== undefined && getSlotUrl(slot)) {
        setOverlay("left-context-menu");
      }
    }
  }

  function handleCandidatesKey(event: KeyboardEvent) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setFocusedCandidateIndex((prev) =>
        findNextInRow(prev, 1, candidateCount),
      );
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setFocusedCandidateIndex((prev) =>
        findNextInRow(prev, -1, candidateCount),
      );
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedCandidateIndex((prev) =>
        findNextVertical(prev, 1, candidateCount),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedCandidateIndex((prev) =>
        findNextVertical(prev, -1, candidateCount),
      );
    } else if (event.key === "Enter") {
      activateCandidateCell(focusedCandidateIndex);
    } else if (event.key === "Alt") {
      event.preventDefault();
      openContextMenu();
    }
  }

  function handleActionsKey(event: KeyboardEvent) {
    const actionCount = 2 + (sources.length > 0 ? 1 : 0);
    if (event.key === "ArrowLeft") {
      setFocusedActionIndex((prev) => Math.max(0, prev - 1));
    } else if (event.key === "ArrowRight") {
      setFocusedActionIndex((prev) => Math.min(actionCount - 1, prev + 1));
    } else if (event.key === "Enter") {
      activateAction(focusedActionIndex);
    }
  }

  function activateAction(index: number) {
    if (sources.length > 0) {
      if (index === 0) handleFetch();
      else if (index === 1) handleSave();
      else handleCancel();
    } else {
      if (index === 0) handleSave();
      else handleCancel();
    }
  }

  function handleOverlayKey(event: KeyboardEvent) {
    if (event.key === "Escape") {
      setOverlay(null);
      setOverlayIndex(0);
      return;
    }
    if (overlay === "context-menu" && event.key === "Enter") {
      setOverlay(null);
      removeCandidate(focusedCandidateIndex);
    } else if (overlay === "left-context-menu" && event.key === "Enter") {
      setOverlayIndex(1);
      setOverlay("left-confirm");
    } else if (overlay === "left-confirm") {
      if (event.key === "ArrowDown") {
        setOverlayIndex((prev) =>
          Math.min(DELETE_OPTIONS.length - 1, prev + 1),
        );
      } else if (event.key === "ArrowUp") {
        setOverlayIndex((prev) => Math.max(0, prev - 1));
      } else if (event.key === "Enter") {
        if (overlayIndex === 0) {
          confirmDeleteSlot();
        } else {
          setOverlay(null);
          setOverlayIndex(0);
        }
      }
    }
  }

  function getSlotUrl(slot: ScreenshotSlot): string | undefined {
    if (deletedSlots.has(slot)) return undefined;
    return (
      slotAssignments[slot] ??
      (game ? deriveAssignedUrl(game, slot) : undefined)
    );
  }

  function activateCandidateCell(index: number) {
    const candidate = localCandidates[index];
    if (candidate) {
      setSlotAssignments((prev) => ({
        ...prev,
        [currentSlot]: candidate.url,
      }));
      setDeletedSlots((prev) => {
        const next = new Set(prev);
        next.delete(currentSlot);
        return next;
      });
    }
  }

  function openContextMenu() {
    setOverlay("context-menu");
  }

  function handleFetch() {
    if (sources.length === 0) return;
    push("game-get-from-catalogue", {
      gameId,
      flow: "screenshots",
      importMode: importMode ? "true" : "false",
      ...(importTitle !== undefined ? { importTitle } : {}),
    });
  }

  function removeCandidate(ci: number) {
    const newCandidates = localCandidates.filter((_, i) => i !== ci);
    setLocalCandidates(newCandidates);
    const newTotal = newCandidates.length;
    setFocusedCandidateIndex(
      newTotal === 0 ? newTotal : Math.min(ci, newTotal - 1),
    );
  }

  function confirmDeleteSlot() {
    const slot = SLOT_ORDER[currentSlotIndex];
    if (slot !== undefined) {
      setSlotAssignments((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
      setDeletedSlots((prev) => new Set([...prev, slot]));
    }
    setOverlay(null);
    setOverlayIndex(0);
  }

  function handleSave() {
    setStore((prev) => ({
      ...prev,
      gameDetails: {
        ...prev.gameDetails,
        games: prev.gameDetails.games.map((g) => {
          if (g.id !== gameId) return g;
          let screenshots = [...g.screenshots];
          for (const slot of SLOT_ORDER) {
            if (deletedSlots.has(slot)) {
              screenshots = screenshots.filter((s) => s.slot !== slot);
              continue;
            }
            const url = slotAssignments[slot];
            if (url === undefined) continue;
            const existing = screenshots.find((s) => s.slot === slot);
            if (existing) {
              screenshots = screenshots.map((s) =>
                s.slot === slot ? { ...s, url } : s,
              );
            } else {
              screenshots = [...screenshots, { slot, url }];
            }
          }
          return { ...g, screenshots };
        }),
      },
    }));
    clearCandidates();
    if (importMode) {
      replace("import-controls", {
        gameId,
        importMode: "true",
        importTitle: importTitle ?? "",
      });
    } else {
      pop();
    }
  }

  function clearCandidates() {
    setStore((prev) => {
      const updated = { ...prev.gameMediaEdit.candidates };
      delete updated[key];
      return {
        ...prev,
        gameMediaEdit: { ...prev.gameMediaEdit, candidates: updated },
      };
    });
  }

  function handleCancel() {
    if (deletedSlots.size > 0) {
      setStore((prev) => ({
        ...prev,
        gameDetails: {
          ...prev.gameDetails,
          games: prev.gameDetails.games.map((g) => {
            if (g.id !== gameId) return g;
            return {
              ...g,
              screenshots: g.screenshots.filter(
                (s) => !deletedSlots.has(s.slot as ScreenshotSlot),
              ),
            };
          }),
        },
      }));
    }
    clearCandidates();
    pop();
  }

  function toggleFocusPanel(reverse = false) {
    const hasCandidates = candidateCount > 0;
    if (focusPanel === "slots") {
      if (reverse) {
        setFocusPanel("actions");
        setFocusedActionIndex(0);
      } else if (hasCandidates) {
        setFocusPanel("candidates");
        containerRef.current?.focus();
      } else {
        setFocusPanel("actions");
        setFocusedActionIndex(0);
      }
    } else if (focusPanel === "candidates") {
      if (reverse) {
        setFocusPanel("slots");
      } else {
        setFocusPanel("actions");
        setFocusedActionIndex(0);
      }
    } else {
      // actions
      if (reverse) {
        if (hasCandidates) {
          setFocusPanel("candidates");
          containerRef.current?.focus();
        } else {
          setFocusPanel("slots");
        }
      } else {
        setFocusPanel("slots");
      }
    }
  }

  const screenTitle = deriveScreenTitle(
    importMode,
    game?.title ?? "Game",
    importTitle,
  );

  const deleteLabel = deriveSlotDeleteLabel(currentSlot);

  const fetchHint =
    focusPanel === "actions" && sources.length === 0
      ? "No catalogues linked. Add a catalogue link to enable fetch."
      : "";
  const bottomBarText = fetchHint;

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">Screenshots</span>
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
        if (focusPanel === "candidates") openContextMenu();
      }}
    >
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
      </div>
      <div className="screen__content">
        <div className="screenshots__layout">
          <div
            className={`screenshots__left-panel${focusPanel === "slots" ? " screenshots__left-panel--focused" : ""}`}
          >
            {SLOT_ORDER.map((slot, index) => {
              const isCurrentSlot = currentSlotIndex === index;
              const assignedUrl = getSlotUrl(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  tabIndex={-1}
                  className={`screenshots__slot${isCurrentSlot ? " screenshots__slot--current" : ""}`}
                  onClick={() => {
                    setFocusPanel("slots");
                    setCurrentSlotIndex(index);
                  }}
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setFocusPanel("slots");
                    setCurrentSlotIndex(index);
                    if (assignedUrl) {
                      setOverlay("left-context-menu");
                    }
                  }}
                >
                  {assignedUrl ? (
                    <img
                      src={assignedUrl}
                      alt={deriveSlotLabel(slot)}
                      className="screenshots__slot-image"
                    />
                  ) : (
                    <div className="screenshots__slot-empty" />
                  )}
                  <span className="screenshots__slot-label">
                    {deriveSlotLabel(slot)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="screenshots__divider" />
          <div className="screenshots__right-panel">
            <div className="screenshots__grid">
              {localCandidates.map((candidate, index) => {
                const isFocused =
                  focusPanel === "candidates" &&
                  focusedCandidateIndex === index;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    tabIndex={-1}
                    className={`screenshots__cell${isFocused ? " screenshots__cell--focused" : ""}`}
                    onClick={() => {
                      setFocusPanel("candidates");
                      setFocusedCandidateIndex(index);
                      setSlotAssignments((prev) => ({
                        ...prev,
                        [currentSlot]: candidate.url,
                      }));
                      setDeletedSlots((prev) => {
                        const next = new Set(prev);
                        next.delete(currentSlot);
                        return next;
                      });
                    }}
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setFocusPanel("candidates");
                      setFocusedCandidateIndex(index);
                      removeCandidate(index);
                    }}
                  >
                    <img
                      src={candidate.url}
                      alt={`Candidate ${index + 1}`}
                      className="screenshots__thumbnail"
                    />
                  </button>
                );
              })}
            </div>
            <div className="screenshots__actions">
              {sources.length > 0 && (
                <button
                  type="button"
                  tabIndex={-1}
                  className={`screenshots__action${focusPanel === "actions" && focusedActionIndex === 0 ? " screenshots__action--active" : ""}`}
                  onClick={handleFetch}
                >
                  Get Media
                </button>
              )}
              {sources.length === 0 && (
                <button
                  type="button"
                  tabIndex={-1}
                  className="screenshots__action screenshots__action--disabled"
                  disabled
                >
                  Get Media
                </button>
              )}
              <button
                type="button"
                tabIndex={-1}
                className={`screenshots__action${focusPanel === "actions" && focusedActionIndex === (sources.length > 0 ? 1 : 0) ? " screenshots__action--active" : ""}`}
                onClick={handleSave}
              >
                Save
              </button>
              <button
                type="button"
                tabIndex={-1}
                className={`screenshots__action${focusPanel === "actions" && focusedActionIndex === (sources.length > 0 ? 2 : 1) ? " screenshots__action--active" : ""}`}
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="screen__bottombar">{bottomBarText}</div>
      {overlay === "context-menu" && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <ul className="overlay__list">
              <li
                className="overlay__row overlay__row--selected"
                onClick={() => {
                  setOverlay(null);
                  removeCandidate(focusedCandidateIndex);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setOverlay(null);
                    removeCandidate(focusedCandidateIndex);
                  }
                }}
              >
                Remove
              </li>
            </ul>
          </div>
        </div>
      )}
      {overlay === "left-context-menu" && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <ul className="overlay__list">
              <li
                className="overlay__row overlay__row--selected"
                onClick={() => {
                  setOverlayIndex(0);
                  setOverlay("left-confirm");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setOverlayIndex(0);
                    setOverlay("left-confirm");
                  }
                }}
              >
                {deleteLabel}
              </li>
            </ul>
          </div>
        </div>
      )}
      {overlay === "left-confirm" && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">{deleteLabel}?</div>
            <ul className="overlay__list">
              {DELETE_OPTIONS.map((option, index) => (
                <li
                  key={option}
                  className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                  onClick={() => {
                    if (index === 0) {
                      confirmDeleteSlot();
                    } else {
                      setOverlay(null);
                      setOverlayIndex(0);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (index === 0) {
                        confirmDeleteSlot();
                      } else {
                        setOverlay(null);
                        setOverlayIndex(0);
                      }
                    }
                  }}
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
