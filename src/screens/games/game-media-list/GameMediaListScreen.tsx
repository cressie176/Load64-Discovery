import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { GameDetails } from "../game-details/types";
import type { MediaCandidate, MediaSlot } from "./types";
import "./index.css";

const GRID_SIZE = 6;
const COLS = 3;
const ADD_CELL_INDEX = 5;
const ADD_OPTIONS = ["From file", "From URL"] as const;

type FocusRegion = "grid" | "actions";

export function deriveSlotName(slot: MediaSlot): string {
  switch (slot) {
    case "cover-thumbnail":
      return "Cover Thumbnail";
    case "loading-screen":
      return "Loading Screen";
    case "title-screen":
      return "Title Screen";
    case "gameplay-screen":
      return "Gameplay Screen";
  }
}

export function deriveScreenTitle(
  importMode: boolean,
  gameTitle: string,
  slotName: string,
  importTitle?: string,
  catalogueName?: string,
  entryId?: string,
): string {
  if (importMode) {
    const title = importTitle ?? gameTitle;
    const source =
      catalogueName && entryId ? ` > ${catalogueName}: ${entryId}` : "";
    return `Import > ${title} > ${slotName}${source}`;
  }
  return `${gameTitle} > Media > ${slotName}`;
}

export function deriveCurrentImageUrl(
  game: GameDetails,
  slot: MediaSlot,
): string | undefined {
  if (slot === "cover-thumbnail") return game.coverUrl;
  const slotMap: Record<string, string> = {
    "loading-screen": "loading",
    "title-screen": "title",
    "gameplay-screen": "gameplay",
  };
  const screenshotSlot = slotMap[slot];
  return game.screenshots.find((s) => s.slot === screenshotSlot)?.url;
}

export function deriveNextImportSlot(slot: MediaSlot): MediaSlot | null {
  const sequence: MediaSlot[] = [
    "loading-screen",
    "title-screen",
    "gameplay-screen",
    "cover-thumbnail",
  ];
  const index = sequence.indexOf(slot);
  if (index === -1 || index === sequence.length - 1) return null;
  return sequence[index + 1] ?? null;
}

function storeKey(gameId: string, slot: MediaSlot): string {
  return `${gameId}-${slot}`;
}

function isCellNavigable(gridIndex: number, candidateCount: number): boolean {
  if (gridIndex === ADD_CELL_INDEX) return true;
  return gridIndex < candidateCount;
}

function findFirstNavigable(candidateCount: number): number {
  if (candidateCount > 0) return 0;
  return ADD_CELL_INDEX;
}

function findNextNavigable(
  from: number,
  delta: number,
  candidateCount: number,
): number {
  let index = from;
  for (let i = 0; i < GRID_SIZE; i++) {
    index = (index + delta + GRID_SIZE) % GRID_SIZE;
    if (isCellNavigable(index, candidateCount)) return index;
  }
  return from;
}

function cellKey(gridIndex: number): string {
  if (gridIndex === ADD_CELL_INDEX) return "cell-add";
  return `cell-${gridIndex}`;
}

interface GameMediaListScreenProps {
  gameId: string;
  mediaSlot: string;
  importMode: boolean;
  importTitle?: string;
  catalogueName?: string;
  entryId?: string;
}

export function GameMediaListScreen({
  gameId,
  mediaSlot,
  importMode,
  importTitle,
  catalogueName,
  entryId,
}: GameMediaListScreenProps) {
  const { pop, push, replace } = useRouter();
  const { store, setStore } = useStore();

  const slot = mediaSlot as MediaSlot;
  const game = store.gameDetails.games.find((g) => g.id === gameId);

  const key = storeKey(gameId, slot);
  const storeCandidates = store.gameMediaEdit.candidates[key] ?? [];

  const [localCandidates, setLocalCandidates] =
    useState<MediaCandidate[]>(storeCandidates);
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("grid");
  const [focusedGridIndex, setFocusedGridIndex] = useState(() =>
    findFirstNavigable(storeCandidates.length),
  );

  useEffect(() => {
    if (storeCandidates.length > localCandidates.length) {
      setLocalCandidates(storeCandidates);
      setFocusedGridIndex(storeCandidates.length - 1);
    }
  }, [storeCandidates, storeCandidates.length, localCandidates.length]);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<
    number | null
  >(null);
  const [focusedActionIndex, setFocusedActionIndex] = useState(0);
  const [showAddOverlay, setShowAddOverlay] = useState(false);
  const [addOverlayIndex, setAddOverlayIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const candidateCount = localCandidates.length;

  function candidateAtIndex(
    gridIndex: number,
  ): { candidate: MediaCandidate; candidateIndex: number } | null {
    if (gridIndex === ADD_CELL_INDEX) return null;
    if (gridIndex >= candidateCount) return null;
    const candidate = localCandidates[gridIndex];
    if (!candidate) return null;
    return { candidate, candidateIndex: gridIndex };
  }

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showAddOverlay) {
        handleAddOverlayKey(event);
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
      handleCancel();
      return;
    }
    if (focusRegion === "grid") {
      handleGridKey(event);
    } else {
      handleActionsKey(event);
    }
  }

  function handleGridKey(event: KeyboardEvent) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setFocusedGridIndex((prev) => findNextNavigable(prev, 1, candidateCount));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setFocusedGridIndex((prev) =>
        findNextNavigable(prev, -1, candidateCount),
      );
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      moveGridVertical(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveGridVertical(-1);
    } else if (event.key === "Enter") {
      activateGridCell(focusedGridIndex);
    } else if (event.key === "Alt") {
      event.preventDefault();
      openContextMenu();
    }
  }

  function moveGridVertical(delta: number) {
    const row = Math.floor(focusedGridIndex / COLS);
    const col = focusedGridIndex % COLS;
    const rows = GRID_SIZE / COLS;
    const newRow = (row + delta + rows) % rows;
    const newIndex = newRow * COLS + col;
    if (isCellNavigable(newIndex, candidateCount)) {
      setFocusedGridIndex(newIndex);
    } else {
      const rowStart = newRow * COLS;
      for (let c = 0; c < COLS; c++) {
        const candidate = rowStart + c;
        if (isCellNavigable(candidate, candidateCount)) {
          setFocusedGridIndex(candidate);
          return;
        }
      }
    }
  }

  function activateGridCell(gridIndex: number) {
    if (gridIndex === ADD_CELL_INDEX) {
      setShowAddOverlay(true);
      setAddOverlayIndex(0);
      return;
    }
    const result = candidateAtIndex(gridIndex);
    if (result) {
      setSelectedCandidateIndex(result.candidateIndex);
    }
  }

  function openContextMenu() {
    const result = candidateAtIndex(focusedGridIndex);
    if (!result) return;
    removeCandidate(result.candidateIndex);
  }

  function removeCandidate(ci: number) {
    const newCount = localCandidates.length - 1;
    setLocalCandidates((prev) => prev.filter((_, i) => i !== ci));
    setSelectedCandidateIndex((prev) => {
      if (prev === null) return null;
      if (prev === ci) return null;
      if (prev > ci) return prev - 1;
      return prev;
    });
    setFocusedGridIndex((prev) => {
      if (isCellNavigable(prev, newCount)) return prev;
      return findFirstNavigable(newCount);
    });
  }

  function handleActionsKey(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      setFocusedActionIndex((prev) => Math.max(0, prev - 1));
    } else if (event.key === "ArrowRight") {
      setFocusedActionIndex((prev) => Math.min(1, prev + 1));
    } else if (event.key === "Enter") {
      if (focusedActionIndex === 0) {
        handleSave();
      } else {
        handleCancel();
      }
    }
  }

  function handleAddOverlayKey(event: KeyboardEvent) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setAddOverlayIndex((prev) => Math.max(0, prev - 1));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setAddOverlayIndex((prev) => Math.min(ADD_OPTIONS.length - 1, prev + 1));
    } else if (event.key === "Enter") {
      const source =
        ADD_OPTIONS[addOverlayIndex] === "From file" ? "file" : "url";
      setShowAddOverlay(false);
      push("game-media-add", { gameId, mediaSlot: slot, source });
    } else if (event.key === "Escape") {
      setShowAddOverlay(false);
    }
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "grid") {
      setFocusRegion("actions");
      setFocusedActionIndex(reverse ? 1 : 0);
    } else {
      setFocusRegion("grid");
      containerRef.current?.focus();
    }
  }

  function handleSave() {
    if (selectedCandidateIndex !== null) {
      const candidate = localCandidates[selectedCandidateIndex];
      if (candidate) {
        assignCandidateToSlot(candidate.url);
      }
    }
    setStore((prev) => ({
      ...prev,
      gameMediaEdit: {
        ...prev.gameMediaEdit,
        candidates: {
          ...prev.gameMediaEdit.candidates,
          [key]: localCandidates,
        },
      },
    }));
    navigateAfterSave();
  }

  function assignCandidateToSlot(url: string) {
    setStore((prev) => ({
      ...prev,
      gameDetails: {
        ...prev.gameDetails,
        games: prev.gameDetails.games.map((g) => {
          if (g.id !== gameId) return g;
          if (slot === "cover-thumbnail") {
            return { ...g, coverUrl: url };
          }
          const slotMap: Record<string, string> = {
            "loading-screen": "loading",
            "title-screen": "title",
            "gameplay-screen": "gameplay",
          };
          const screenshotSlot = slotMap[slot];
          const existing = g.screenshots.find((s) => s.slot === screenshotSlot);
          if (existing) {
            return {
              ...g,
              screenshots: g.screenshots.map((s) =>
                s.slot === screenshotSlot ? { ...s, url } : s,
              ),
            };
          }
          return {
            ...g,
            screenshots: [
              ...g.screenshots,
              {
                slot: screenshotSlot as "loading" | "title" | "gameplay",
                url,
              },
            ],
          };
        }),
      },
    }));
  }

  function navigateAfterSave() {
    if (!importMode) {
      pop();
      return;
    }
    const nextSlot = deriveNextImportSlot(slot);
    if (nextSlot === null) {
      replace("import-controls", {
        gameId,
        importMode: "true",
        importTitle: importTitle ?? "",
      });
    } else {
      replace("game-media-list", {
        gameId,
        mediaSlot: nextSlot,
        importMode: "true",
        ...(importTitle !== undefined ? { importTitle } : {}),
        ...(catalogueName !== undefined ? { catalogueName } : {}),
        ...(entryId !== undefined ? { entryId } : {}),
      });
    }
  }

  function handleCancel() {
    pop();
  }

  const slotName = deriveSlotName(slot);
  const gameTitle = game?.title ?? "Game";
  const screenTitle = deriveScreenTitle(
    importMode,
    gameTitle,
    slotName,
    importTitle,
    catalogueName,
    entryId,
  );
  const currentImageUrl = game ? deriveCurrentImageUrl(game, slot) : undefined;

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">Media</span>
          <div className="screen__topbar-ctas" />
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
        if (focusRegion === "grid") openContextMenu();
      }}
    >
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
        <div className="screen__topbar-ctas" />
      </div>
      <div className="screen__content">
        <div className="media-edit__layout">
          <div className="media-edit__current-panel">
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt="Current"
                className="media-edit__current-image"
              />
            ) : (
              <div className="media-edit__current-empty">None</div>
            )}
            <span className="media-edit__current-label">Current</span>
          </div>
          <div className="media-edit__divider" />
          <div className="media-edit__right">
            <div className="media-edit__grid">
              {Array.from({ length: GRID_SIZE }).map((_, gridIndex) => {
                const isAdd = gridIndex === ADD_CELL_INDEX;
                const isEmpty = !isAdd && gridIndex >= candidateCount;
                const cellResult = isAdd ? null : candidateAtIndex(gridIndex);
                const isFocused =
                  focusRegion === "grid" && focusedGridIndex === gridIndex;
                const isSelected =
                  cellResult !== null &&
                  cellResult.candidateIndex === selectedCandidateIndex;

                if (isEmpty) {
                  return (
                    <div
                      key={cellKey(gridIndex)}
                      className="media-edit__cell media-edit__cell--empty"
                    />
                  );
                }

                if (isAdd) {
                  return (
                    <button
                      key={cellKey(gridIndex)}
                      type="button"
                      className={`media-edit__cell${isFocused ? " media-edit__cell--focused" : ""}`}
                      onClick={() => {
                        setFocusRegion("grid");
                        setFocusedGridIndex(gridIndex);
                        activateGridCell(gridIndex);
                      }}
                    >
                      <span className="media-edit__add-label">Add</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={cellKey(gridIndex)}
                    type="button"
                    className={`media-edit__cell${isFocused ? " media-edit__cell--focused" : ""}${isSelected ? " media-edit__cell--selected" : ""}`}
                    onClick={() => {
                      setFocusRegion("grid");
                      setFocusedGridIndex(gridIndex);
                      if (cellResult) {
                        setSelectedCandidateIndex(cellResult.candidateIndex);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setFocusRegion("grid");
                      setFocusedGridIndex(gridIndex);
                      if (cellResult) {
                        removeCandidate(cellResult.candidateIndex);
                      }
                    }}
                  >
                    {cellResult && (
                      <img
                        src={cellResult.candidate.url}
                        alt={`Candidate ${cellResult.candidateIndex + 1}`}
                        className="media-edit__thumbnail"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="media-edit__actions">
              <button
                type="button"
                className={`media-edit__action${focusRegion === "actions" && focusedActionIndex === 0 ? " media-edit__action--active" : ""}`}
                onClick={handleSave}
              >
                Save
              </button>
              <button
                type="button"
                className={`media-edit__action${focusRegion === "actions" && focusedActionIndex === 1 ? " media-edit__action--active" : ""}`}
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="screen__bottombar" />
      {showAddOverlay && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">Add image</div>
            <ul className="overlay__list">
              {ADD_OPTIONS.map((option, index) => (
                <li
                  key={option}
                  className={`overlay__row${index === addOverlayIndex ? " overlay__row--selected" : ""}`}
                  onClick={() => {
                    const source = option === "From file" ? "file" : "url";
                    setShowAddOverlay(false);
                    push("game-media-add", { gameId, mediaSlot: slot, source });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const source = option === "From file" ? "file" : "url";
                      setShowAddOverlay(false);
                      push("game-media-add", {
                        gameId,
                        mediaSlot: slot,
                        source,
                      });
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
