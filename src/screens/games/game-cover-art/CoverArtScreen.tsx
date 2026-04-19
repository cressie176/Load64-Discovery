import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { MediaCandidate } from "../game-media-edit/types";
import "./index.css";

const MAX_CANDIDATES = 8;
const COLS = 3;
const DELETE_OPTIONS = ["Yes", "No"] as const;

type FocusRegion = "coverart" | "candidates" | "actions";
type Overlay = "left-context-menu" | "left-confirm";

export function deriveScreenTitle(
  importMode: boolean,
  gameTitle: string,
  importTitle?: string,
): string {
  if (importMode) {
    const title = importTitle ?? gameTitle;
    return `Import Games > ${title} > Cover Art`;
  }
  return `${gameTitle} > Cover Art`;
}

export function deriveCoverArtUrl(
  coverUrl: string | undefined,
): string | undefined {
  return coverUrl;
}

export function derivePreviewUrl(
  deleted: boolean,
  selectedUrl: string | undefined,
  savedUrl: string | undefined,
): string | undefined {
  if (deleted) return undefined;
  return selectedUrl ?? savedUrl;
}

function storeKey(gameId: string): string {
  return `${gameId}-cover-thumbnail`;
}

function findNextInRow(current: number, delta: number, count: number): number {
  const next = current + delta;
  if (next < 0) return 0;
  if (next >= count) return count - 1;
  return next;
}

function findNextVertical(
  current: number,
  delta: number,
  count: number,
): number {
  const row = Math.floor(current / COLS);
  const col = current % COLS;
  const newIndex = (row + delta) * COLS + col;
  if (newIndex < 0 || newIndex >= count) return current;
  return newIndex;
}

interface CoverArtScreenProps {
  gameId: string;
  importMode: boolean;
  importTitle?: string;
}

export function CoverArtScreen({
  gameId,
  importMode,
  importTitle,
}: CoverArtScreenProps) {
  const { pop, push, replace } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);

  const key = storeKey(gameId);
  const storeCandidates = store.gameMediaEdit.candidates[key] ?? [];

  const [localCandidates, setLocalCandidates] = useState<MediaCandidate[]>([]);
  const consumedStoreCountRef = useRef(0);
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | undefined>(
    undefined,
  );
  const [coverArtDeleted, setCoverArtDeleted] = useState(false);
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("coverart");
  const [focusedCandidateIndex, setFocusedCandidateIndex] = useState(0);
  const [focusedActionIndex, setFocusedActionIndex] = useState(0);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [overlayIndex, setOverlayIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const candidateCount = localCandidates.length;
  const sources = game?.sources ?? [];

  useEffect(() => {
    const unconsumed = storeCandidates.slice(consumedStoreCountRef.current);
    if (unconsumed.length === 0) return;
    consumedStoreCountRef.current = storeCandidates.length;
    setLocalCandidates((prev) =>
      [...prev, ...unconsumed].slice(0, MAX_CANDIDATES),
    );
    setFocusRegion("actions");
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
      toggleFocusRegion(event.shiftKey);
      return;
    }
    if (event.key === "Escape") {
      handleCancel();
      return;
    }
    if (focusRegion === "coverart") {
      handleCoverArtKey(event);
    } else if (focusRegion === "candidates") {
      handleCandidatesKey(event);
    } else if (focusRegion === "actions") {
      handleActionsKey(event);
    }
  }

  function handleCoverArtKey(event: KeyboardEvent) {
    if (event.key === "Alt") {
      event.preventDefault();
      setOverlay("left-context-menu");
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
      const candidate = localCandidates[focusedCandidateIndex];
      if (candidate) {
        setSelectedCoverUrl(candidate.url);
        setCoverArtDeleted(false);
      }
    } else if (event.key === "Alt") {
      event.preventDefault();
      removeCandidate(focusedCandidateIndex);
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
      else if (index === 1) {
        if (!saveDisabled) handleSave();
      } else handleCancel();
    } else {
      if (index === 0) {
        if (!saveDisabled) handleSave();
      } else handleCancel();
    }
  }

  function handleOverlayKey(event: KeyboardEvent) {
    if (event.key === "Escape") {
      setOverlay(null);
      setOverlayIndex(0);
      return;
    }
    if (overlay === "left-context-menu" && event.key === "Enter") {
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
          confirmDeleteCoverArt();
        } else {
          setOverlay(null);
          setOverlayIndex(0);
        }
      }
    }
  }

  function handleFetch() {
    if (sources.length === 0) return;
    push("game-get-from-catalogue", {
      gameId,
      flow: "cover-art",
      importMode: importMode ? "true" : "false",
      ...(importTitle !== undefined ? { importTitle } : {}),
    });
  }

  function removeCandidate(ci: number) {
    const newCandidates = localCandidates.filter((_, i) => i !== ci);
    setLocalCandidates(newCandidates);
    const newTotal = newCandidates.length;
    setFocusedCandidateIndex(newTotal === 0 ? 0 : Math.min(ci, newTotal - 1));
  }

  function confirmDeleteCoverArt() {
    setCoverArtDeleted(true);
    setSelectedCoverUrl(undefined);
    setOverlay(null);
    setOverlayIndex(0);
    setFocusRegion("candidates");
    setFocusedCandidateIndex(0);
  }

  function handleSave() {
    if (coverArtDeleted) {
      setStore((prev) => ({
        ...prev,
        gameDetails: {
          ...prev.gameDetails,
          games: prev.gameDetails.games.map((g) =>
            g.id === gameId ? { ...g, coverUrl: undefined } : g,
          ),
        },
      }));
    } else if (selectedCoverUrl !== undefined) {
      setStore((prev) => ({
        ...prev,
        gameDetails: {
          ...prev.gameDetails,
          games: prev.gameDetails.games.map((g) =>
            g.id === gameId ? { ...g, coverUrl: selectedCoverUrl } : g,
          ),
        },
      }));
    }
    clearCandidates();
    if (importMode) {
      replace("game-screenshots", {
        gameId,
        importMode: "true",
        ...(importTitle !== undefined ? { importTitle } : {}),
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
    if (coverArtDeleted) {
      setStore((prev) => ({
        ...prev,
        gameDetails: {
          ...prev.gameDetails,
          games: prev.gameDetails.games.map((g) =>
            g.id === gameId ? { ...g, coverUrl: undefined } : g,
          ),
        },
      }));
    }
    clearCandidates();
    pop();
  }

  function toggleFocusRegion(reverse = false) {
    const hasCoverArt = !!previewUrl;
    const hasCandidates = candidateCount > 0;
    if (focusRegion === "coverart") {
      if (reverse) {
        setFocusRegion("actions");
        setFocusedActionIndex(0);
      } else if (hasCandidates) {
        setFocusRegion("candidates");
        setFocusedCandidateIndex(0);
      } else {
        setFocusRegion("actions");
        setFocusedActionIndex(0);
      }
    } else if (focusRegion === "candidates") {
      if (reverse) {
        if (hasCoverArt) {
          setFocusRegion("coverart");
        } else {
          setFocusRegion("actions");
          setFocusedActionIndex(0);
        }
      } else {
        setFocusRegion("actions");
        setFocusedActionIndex(0);
      }
    } else {
      // actions
      if (reverse) {
        if (hasCandidates) {
          setFocusRegion("candidates");
          setFocusedCandidateIndex(0);
        } else if (hasCoverArt) {
          setFocusRegion("coverart");
        } else {
          setFocusRegion("actions");
          setFocusedActionIndex(0);
        }
      } else if (hasCoverArt) {
        setFocusRegion("coverart");
      } else if (hasCandidates) {
        setFocusRegion("candidates");
        setFocusedCandidateIndex(0);
      } else {
        setFocusRegion("actions");
        setFocusedActionIndex(0);
      }
    }
  }

  const screenTitle = deriveScreenTitle(
    importMode,
    game?.title ?? "Game",
    importTitle,
  );

  const previewUrl = derivePreviewUrl(
    coverArtDeleted,
    selectedCoverUrl,
    game?.coverUrl,
  );

  const saveDisabled = selectedCoverUrl === undefined && !coverArtDeleted;

  const fetchHint =
    focusRegion === "actions" && sources.length === 0
      ? "No catalogues linked. Add a catalogue link to enable fetch."
      : "";
  const bottomBarText = fetchHint;

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">Cover Art</span>
        </div>
        <div className="screen__content screen__content--empty">
          Game not found.
        </div>
        <div className="screen__bottombar" />
      </div>
    );
  }

  return (
    <div role="application" className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
      </div>
      <div className="screen__content">
        <div className="cover-art__layout">
          <div className="cover-art__left-panel">
            {previewUrl ? (
              <button
                type="button"
                className={`cover-art__slot-button${focusRegion === "coverart" ? " cover-art__slot-button--focused" : ""}`}
                tabIndex={-1}
                onClick={() => setFocusRegion("coverart")}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setFocusRegion("coverart");
                  setOverlay("left-context-menu");
                }}
              >
                <img
                  src={previewUrl}
                  alt="Cover Art"
                  className="cover-art__slot-image"
                />
              </button>
            ) : (
              <div className="cover-art__slot-empty" />
            )}
            <span className="cover-art__slot-label">Cover Art</span>
          </div>
          <div className="cover-art__divider" />
          <div className="cover-art__right-panel">
            <div className="cover-art__grid">
              {localCandidates.map((candidate, index) => {
                const isFocused =
                  focusRegion === "candidates" &&
                  focusedCandidateIndex === index;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    className={`cover-art__cell${isFocused ? " cover-art__cell--focused" : ""}`}
                    onClick={() => {
                      setFocusRegion("candidates");
                      setFocusedCandidateIndex(index);
                      setSelectedCoverUrl(candidate.url);
                      setCoverArtDeleted(false);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      removeCandidate(index);
                    }}
                  >
                    <img
                      src={candidate.url}
                      alt={`Candidate ${index + 1}`}
                      className="cover-art__thumbnail"
                    />
                  </button>
                );
              })}
            </div>
            <div className="cover-art__actions">
              {sources.length > 0 && (
                <button
                  type="button"
                  className={`cover-art__action${focusRegion === "actions" && focusedActionIndex === 0 ? " cover-art__action--active" : ""}`}
                  onClick={handleFetch}
                >
                  Get Media
                </button>
              )}
              {sources.length === 0 && (
                <button
                  type="button"
                  className="cover-art__action cover-art__action--disabled"
                  disabled
                >
                  Get Media
                </button>
              )}
              <button
                type="button"
                className={`cover-art__action${saveDisabled ? " cover-art__action--disabled" : ""}${focusRegion === "actions" && focusedActionIndex === (sources.length > 0 ? 1 : 0) ? " cover-art__action--active" : ""}`}
                disabled={saveDisabled}
                onClick={handleSave}
              >
                Save
              </button>
              <button
                type="button"
                className={`cover-art__action${focusRegion === "actions" && focusedActionIndex === (sources.length > 0 ? 2 : 1) ? " cover-art__action--active" : ""}`}
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="screen__bottombar">{bottomBarText}</div>
      {overlay === "left-context-menu" && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <ul className="overlay__list">
              <li
                className="overlay__row overlay__row--selected"
                onClick={() => {
                  setOverlayIndex(1);
                  setOverlay("left-confirm");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setOverlayIndex(1);
                    setOverlay("left-confirm");
                  }
                }}
              >
                Delete cover art
              </li>
            </ul>
          </div>
        </div>
      )}
      {overlay === "left-confirm" && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">Delete cover art?</div>
            <ul className="overlay__list">
              {DELETE_OPTIONS.map((option, index) => (
                <li
                  key={option}
                  className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                  onClick={() => {
                    if (index === 0) {
                      confirmDeleteCoverArt();
                    } else {
                      setOverlay(null);
                      setOverlayIndex(0);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (index === 0) {
                        confirmDeleteCoverArt();
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
