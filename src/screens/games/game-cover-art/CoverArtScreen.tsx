import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { MediaCandidate } from "../game-media-edit/types";
import "./index.css";

const MAX_CANDIDATES = 8;
const COLS = 3;
const ADD_OPTIONS = ["From file", "From URL"] as const;

type FocusRegion = "candidates" | "actions" | "topbar";
type TopBarCta = "back";
type Overlay = "add" | "fetch" | "context-menu";

const TOP_BAR_CTAS: TopBarCta[] = ["back"];

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

function storeKey(gameId: string): string {
  return `${gameId}-cover-thumbnail`;
}

function totalCells(candidateCount: number): number {
  return candidateCount + 1;
}

function isAddIndex(index: number, candidateCount: number): boolean {
  return index === candidateCount;
}

function findNextInRow(
  current: number,
  delta: number,
  candidateCount: number,
): number {
  const total = totalCells(candidateCount);
  let next = current + delta;
  if (next < 0) next = 0;
  if (next >= total) next = total - 1;
  return next;
}

function findNextVertical(
  current: number,
  delta: number,
  candidateCount: number,
): number {
  const total = totalCells(candidateCount);
  const row = Math.floor(current / COLS);
  const col = current % COLS;
  const newRow = row + delta;
  const newIndex = newRow * COLS + col;
  if (newIndex < 0) return current;
  if (newIndex >= total) return current;
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
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("candidates");
  const [focusedCandidateIndex, setFocusedCandidateIndex] = useState(0);
  const [focusedActionIndex, setFocusedActionIndex] = useState(0);
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("back");
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [overlayIndex, setOverlayIndex] = useState(0);
  const [fetchingFrom, setFetchingFrom] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);

  const candidateCount = localCandidates.length;
  const sources = game?.sources ?? [];

  useEffect(() => {
    const unconsumed = storeCandidates.slice(consumedStoreCountRef.current);
    if (unconsumed.length === 0) return;
    consumedStoreCountRef.current = storeCandidates.length;
    setLocalCandidates((prev) => {
      const updated = [...prev, ...unconsumed].slice(0, MAX_CANDIDATES);
      setFocusedCandidateIndex(updated.length - 1);
      return updated;
    });
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
    if (focusRegion === "topbar") {
      handleTopBarKey(event);
    } else if (focusRegion === "candidates") {
      handleCandidatesKey(event);
    } else if (focusRegion === "actions") {
      handleActionsKey(event);
    }
  }

  function handleTopBarKey(event: KeyboardEvent) {
    if (event.key === "Enter") {
      pop();
    }
  }

  function handleCandidatesKey(event: KeyboardEvent) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const next = findNextInRow(focusedCandidateIndex, 1, candidateCount);
      setFocusedCandidateIndex(next);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const next = findNextInRow(focusedCandidateIndex, -1, candidateCount);
      setFocusedCandidateIndex(next);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = findNextVertical(focusedCandidateIndex, 1, candidateCount);
      setFocusedCandidateIndex(next);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = findNextVertical(focusedCandidateIndex, -1, candidateCount);
      setFocusedCandidateIndex(next);
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
      if (index === 0) openFetchOverlay();
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
      return;
    }
    if (overlay === "add") {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setOverlayIndex((prev) => Math.max(0, prev - 1));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setOverlayIndex((prev) => Math.min(ADD_OPTIONS.length - 1, prev + 1));
      } else if (event.key === "Enter") {
        const option = ADD_OPTIONS[overlayIndex];
        setOverlay(null);
        if (option === "From file") {
          handleFromFile();
        } else {
          push("game-media-add", {
            gameId,
            mediaSlot: "cover-thumbnail",
            source: "url",
          });
        }
      }
    } else if (overlay === "fetch") {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setOverlayIndex((prev) => Math.max(0, prev - 1));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setOverlayIndex((prev) => Math.min(sources.length - 1, prev + 1));
      } else if (event.key === "Enter") {
        const source = sources[overlayIndex];
        if (source) {
          setOverlay(null);
          handleFetch(source.catalogueName);
        }
      }
    } else if (overlay === "context-menu") {
      if (event.key === "Enter") {
        setOverlay(null);
        removeCandidate(focusedCandidateIndex);
      }
    }
  }

  function activateCandidateCell(index: number) {
    if (isAddIndex(index, candidateCount)) {
      setOverlay("add");
      setOverlayIndex(0);
    } else {
      const candidate = localCandidates[index];
      if (candidate) {
        setSelectedCoverUrl(candidate.url);
      }
    }
  }

  function openContextMenu() {
    if (!isAddIndex(focusedCandidateIndex, candidateCount)) {
      setOverlay("context-menu");
      setOverlayIndex(0);
    }
  }

  function openFetchOverlay() {
    if (sources.length === 0) return;
    setOverlay("fetch");
    setOverlayIndex(0);
  }

  function handleFromFile() {
    if (candidateCount >= MAX_CANDIDATES) return;
    const urls = [
      `https://placehold.co/270x360/1a1a2e/4040ff?text=Cover+${candidateCount + 1}`,
    ];
    const newCandidates = urls.map((url) => ({
      id: crypto.randomUUID(),
      url,
    }));
    const updated = [...localCandidates, ...newCandidates].slice(
      0,
      MAX_CANDIDATES,
    );
    setLocalCandidates(updated);
    setFocusedCandidateIndex(updated.length - 1);
  }

  function handleFetch(catalogueName: string) {
    setFetchingFrom(catalogueName);
    setStatusMessage(`Fetching from ${catalogueName}…`);
    setTimeout(() => {
      setFetchingFrom(null);
      const newCandidate: MediaCandidate = {
        id: crypto.randomUUID(),
        url: `https://placehold.co/270x360/1a1a2e/4040ff?text=${encodeURIComponent(catalogueName)}`,
      };
      const updated = [...localCandidates, newCandidate].slice(
        0,
        MAX_CANDIDATES,
      );
      setLocalCandidates(updated);
      setFocusedCandidateIndex(updated.length - 1);
      setStatusMessage("");
    }, 800);
  }

  function removeCandidate(ci: number) {
    const newCandidates = localCandidates.filter((_, i) => i !== ci);
    setLocalCandidates(newCandidates);
    const newTotal = newCandidates.length;
    setFocusedCandidateIndex(
      newTotal === 0 ? newTotal : Math.min(ci, newTotal - 1),
    );
  }

  function handleSave() {
    if (selectedCoverUrl !== undefined) {
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

  function handleCancel() {
    pop();
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "candidates") {
      if (reverse) {
        const cta = TOP_BAR_CTAS[TOP_BAR_CTAS.length - 1] as TopBarCta;
        setFocusRegion("topbar");
        setFocusedCta(cta);
        focusCtaButton(cta);
      } else {
        setFocusRegion("actions");
        setFocusedActionIndex(0);
      }
    } else if (focusRegion === "actions") {
      if (reverse) {
        setFocusRegion("candidates");
        containerRef.current?.focus();
      } else {
        const cta = TOP_BAR_CTAS[0] as TopBarCta;
        setFocusRegion("topbar");
        setFocusedCta(cta);
        focusCtaButton(cta);
      }
    } else {
      const currentIndex = TOP_BAR_CTAS.indexOf(focusedCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < TOP_BAR_CTAS.length) {
        const nextCta = TOP_BAR_CTAS[nextIndex] as TopBarCta;
        setFocusedCta(nextCta);
        focusCtaButton(nextCta);
      } else {
        if (reverse) {
          setFocusRegion("actions");
          setFocusedActionIndex(0);
        } else {
          setFocusRegion("candidates");
          containerRef.current?.focus();
        }
      }
    }
  }

  function focusCtaButton(cta: TopBarCta) {
    if (cta === "back") {
      backButtonRef.current?.focus();
    }
  }

  const screenTitle = deriveScreenTitle(
    importMode,
    game?.title ?? "Game",
    importTitle,
  );

  const previewUrl = selectedCoverUrl ?? game?.coverUrl;

  const fetchHint =
    focusRegion === "actions" && sources.length === 0
      ? "No catalogues linked. Add a catalogue link to enable fetch."
      : "";
  const bottomBarText = fetchingFrom
    ? `Fetching from ${fetchingFrom}…`
    : statusMessage || fetchHint;

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">Cover Art</span>
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
        if (focusRegion === "candidates") openContextMenu();
      }}
    >
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
        <div className="screen__topbar-ctas">
          <a
            ref={backButtonRef}
            href="#"
            className={`topbar-cta topbar-cta--nav${focusRegion === "topbar" && focusedCta === "back" ? " topbar-cta--focused" : ""}`}
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
        <div className="cover-art__layout">
          <div className="cover-art__left-panel">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Cover Art"
                className="cover-art__slot-image"
              />
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
                    }}
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setFocusRegion("candidates");
                      setFocusedCandidateIndex(index);
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
              <button
                type="button"
                className={`cover-art__cell${focusRegion === "candidates" && focusedCandidateIndex === candidateCount ? " cover-art__cell--focused" : ""}${candidateCount >= MAX_CANDIDATES ? " cover-art__cell--disabled" : ""}`}
                disabled={candidateCount >= MAX_CANDIDATES}
                onClick={() => {
                  if (candidateCount >= MAX_CANDIDATES) return;
                  setFocusRegion("candidates");
                  setFocusedCandidateIndex(candidateCount);
                  setOverlay("add");
                  setOverlayIndex(0);
                }}
              >
                <span className="cover-art__add-label">Add</span>
              </button>
            </div>
            <div className="cover-art__actions">
              {sources.length > 0 && (
                <button
                  type="button"
                  className={`cover-art__action${focusRegion === "actions" && focusedActionIndex === 0 ? " cover-art__action--active" : ""}`}
                  onClick={openFetchOverlay}
                >
                  Fetch
                </button>
              )}
              {sources.length === 0 && (
                <button
                  type="button"
                  className="cover-art__action cover-art__action--disabled"
                  disabled
                >
                  Fetch
                </button>
              )}
              <button
                type="button"
                className={`cover-art__action${focusRegion === "actions" && focusedActionIndex === (sources.length > 0 ? 1 : 0) ? " cover-art__action--active" : ""}`}
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
      {overlay === "add" && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">Add image</div>
            <ul className="overlay__list">
              {ADD_OPTIONS.map((option, index) => (
                <li
                  key={option}
                  className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                  onClick={() => {
                    setOverlay(null);
                    if (option === "From file") {
                      handleFromFile();
                    } else {
                      push("game-media-add", {
                        gameId,
                        mediaSlot: "cover-thumbnail",
                        source: "url",
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setOverlay(null);
                      if (option === "From file") {
                        handleFromFile();
                      } else {
                        push("game-media-add", {
                          gameId,
                          mediaSlot: "cover-thumbnail",
                          source: "url",
                        });
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
      {overlay === "fetch" && sources.length > 0 && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">Fetch from</div>
            <ul className="overlay__list">
              {sources.map((source, index) => (
                <li
                  key={source.catalogueName}
                  className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                  onClick={() => {
                    setOverlay(null);
                    handleFetch(source.catalogueName);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setOverlay(null);
                      handleFetch(source.catalogueName);
                    }
                  }}
                >
                  {source.catalogueName}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
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
    </div>
  );
}
