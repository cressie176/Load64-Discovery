import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { GameDetails } from "../game-details/types";
import type { MediaCandidate } from "../game-media-edit/types";
import "./index.css";

const MAX_CANDIDATES = 8;
const COLS = 3;
const ADD_OPTIONS = ["From file", "From URL"] as const;

type ScreenshotSlot = "loading" | "title" | "gameplay";
type FocusPanel = "slots" | "candidates" | "actions" | "topbar";
type TopBarCta = "back";
type Overlay = "add" | "fetch" | "context-menu";

const SLOT_ORDER: ScreenshotSlot[] = ["loading", "title", "gameplay"];
const TOP_BAR_CTAS: TopBarCta[] = ["back"];

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

export function deriveAssignedUrl(
  game: GameDetails,
  slot: ScreenshotSlot,
): string | undefined {
  return game.screenshots.find((s) => s.slot === slot)?.url;
}

function candidatesStoreKey(gameId: string): string {
  return `${gameId}-screenshots`;
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

  const [localCandidates, setLocalCandidates] =
    useState<MediaCandidate[]>(storeCandidates);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [slotAssignments, setSlotAssignments] = useState<
    Partial<Record<ScreenshotSlot, string>>
  >({});
  const [focusPanel, setFocusPanel] = useState<FocusPanel>("slots");
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
  const currentSlot = SLOT_ORDER[currentSlotIndex] ?? "loading";

  useEffect(() => {
    if (storeCandidates.length > localCandidates.length) {
      setLocalCandidates(storeCandidates);
      setFocusedCandidateIndex(storeCandidates.length - 1);
    }
  }, [storeCandidates, storeCandidates.length, localCandidates.length]);

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
    if (focusPanel === "topbar") {
      handleTopBarKey(event);
    } else if (focusPanel === "slots") {
      handleSlotsKey(event);
    } else if (focusPanel === "candidates") {
      handleCandidatesKey(event);
    } else if (focusPanel === "actions") {
      handleActionsKey(event);
    }
  }

  function handleTopBarKey(event: KeyboardEvent) {
    if (event.key === "Enter") {
      if (importMode) {
        replace("game-cover-art", {
          gameId,
          importMode: "true",
          ...(importTitle !== undefined ? { importTitle } : {}),
        });
      } else {
        pop();
      }
    }
  }

  function handleSlotsKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCurrentSlotIndex((prev) => Math.min(SLOT_ORDER.length - 1, prev + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCurrentSlotIndex((prev) => Math.max(0, prev - 1));
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
            mediaSlot: "loading-screen",
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
        setSlotAssignments((prev) => ({
          ...prev,
          [currentSlot]: candidate.url,
        }));
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
    const newCandidate: MediaCandidate = {
      id: crypto.randomUUID(),
      url: `https://placehold.co/320x200/1a1a2e/4040ff?text=Screenshot+${candidateCount + 1}`,
    };
    const updated = [...localCandidates, newCandidate].slice(0, MAX_CANDIDATES);
    setLocalCandidates(updated);
    setFocusedCandidateIndex(updated.length - 1);
    setStore((prev) => ({
      ...prev,
      gameMediaEdit: {
        ...prev.gameMediaEdit,
        candidates: {
          ...prev.gameMediaEdit.candidates,
          [key]: updated,
        },
      },
    }));
  }

  function handleFetch(catalogueName: string) {
    setFetchingFrom(catalogueName);
    setStatusMessage(`Fetching from ${catalogueName}…`);
    setTimeout(() => {
      setFetchingFrom(null);
      const newCandidate: MediaCandidate = {
        id: crypto.randomUUID(),
        url: `https://placehold.co/320x200/1a1a2e/4040ff?text=${encodeURIComponent(catalogueName)}`,
      };
      const updated = [...localCandidates, newCandidate].slice(
        0,
        MAX_CANDIDATES,
      );
      setLocalCandidates(updated);
      setFocusedCandidateIndex(updated.length - 1);
      setStatusMessage("");
      setStore((prev) => ({
        ...prev,
        gameMediaEdit: {
          ...prev.gameMediaEdit,
          candidates: {
            ...prev.gameMediaEdit.candidates,
            [key]: updated,
          },
        },
      }));
    }, 800);
  }

  function removeCandidate(ci: number) {
    const newCandidates = localCandidates.filter((_, i) => i !== ci);
    setLocalCandidates(newCandidates);
    setFocusedCandidateIndex((prev) => {
      const newTotal = newCandidates.length;
      if (prev >= newTotal) return Math.max(0, newTotal - 1);
      return prev;
    });
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

  function handleCancel() {
    pop();
  }

  function toggleFocusPanel(reverse = false) {
    if (focusPanel === "slots") {
      if (reverse) {
        const cta = TOP_BAR_CTAS[TOP_BAR_CTAS.length - 1] as TopBarCta;
        setFocusPanel("topbar");
        setFocusedCta(cta);
        focusCtaButton(cta);
      } else {
        setFocusPanel("candidates");
        containerRef.current?.focus();
      }
    } else if (focusPanel === "candidates") {
      if (reverse) {
        setFocusPanel("slots");
      } else {
        setFocusPanel("actions");
        setFocusedActionIndex(0);
      }
    } else if (focusPanel === "actions") {
      if (reverse) {
        setFocusPanel("candidates");
        containerRef.current?.focus();
      } else {
        const cta = TOP_BAR_CTAS[0] as TopBarCta;
        setFocusPanel("topbar");
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
          setFocusPanel("actions");
          setFocusedActionIndex(0);
        } else {
          setFocusPanel("slots");
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

  const fetchHint =
    focusPanel === "actions" && sources.length === 0
      ? "No catalogues linked. Add a catalogue link to enable fetch."
      : "";
  const bottomBarText = fetchingFrom
    ? `Fetching from ${fetchingFrom}…`
    : statusMessage || fetchHint;

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">Screenshots</span>
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
        if (focusPanel === "candidates") openContextMenu();
      }}
    >
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
        <div className="screen__topbar-ctas">
          <a
            ref={backButtonRef}
            href="#"
            className={`topbar-cta topbar-cta--nav${focusPanel === "topbar" && focusedCta === "back" ? " topbar-cta--focused" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              if (importMode) {
                replace("game-cover-art", {
                  gameId,
                  importMode: "true",
                  ...(importTitle !== undefined ? { importTitle } : {}),
                });
              } else {
                pop();
              }
            }}
          >
            Back
          </a>
        </div>
      </div>
      <div className="screen__content">
        <div className="screenshots__layout">
          <div
            className={`screenshots__left-panel${focusPanel === "slots" ? " screenshots__left-panel--focused" : ""}`}
          >
            {SLOT_ORDER.map((slot, index) => {
              const isCurrentSlot = currentSlotIndex === index;
              const assignedUrl =
                slotAssignments[slot] ?? deriveAssignedUrl(game, slot);
              return (
                <button
                  key={slot}
                  type="button"
                  className={`screenshots__slot${isCurrentSlot ? " screenshots__slot--current" : ""}`}
                  onClick={() => {
                    setFocusPanel("slots");
                    setCurrentSlotIndex(index);
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
                    className={`screenshots__cell${isFocused ? " screenshots__cell--focused" : ""}`}
                    onClick={() => {
                      setFocusPanel("candidates");
                      setFocusedCandidateIndex(index);
                      setSlotAssignments((prev) => ({
                        ...prev,
                        [currentSlot]: candidate.url,
                      }));
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
              <button
                type="button"
                className={`screenshots__cell${focusPanel === "candidates" && focusedCandidateIndex === candidateCount ? " screenshots__cell--focused" : ""}${candidateCount >= MAX_CANDIDATES ? " screenshots__cell--disabled" : ""}`}
                disabled={candidateCount >= MAX_CANDIDATES}
                onClick={() => {
                  if (candidateCount >= MAX_CANDIDATES) return;
                  setFocusPanel("candidates");
                  setFocusedCandidateIndex(candidateCount);
                  setOverlay("add");
                  setOverlayIndex(0);
                }}
              >
                <span className="screenshots__add-label">Add</span>
              </button>
            </div>
            <div className="screenshots__actions">
              {sources.length > 0 && (
                <button
                  type="button"
                  className={`screenshots__action${focusPanel === "actions" && focusedActionIndex === 0 ? " screenshots__action--active" : ""}`}
                  onClick={openFetchOverlay}
                >
                  Fetch
                </button>
              )}
              {sources.length === 0 && (
                <button
                  type="button"
                  className="screenshots__action screenshots__action--disabled"
                  disabled
                >
                  Fetch
                </button>
              )}
              <button
                type="button"
                className={`screenshots__action${focusPanel === "actions" && focusedActionIndex === (sources.length > 0 ? 1 : 0) ? " screenshots__action--active" : ""}`}
                onClick={handleSave}
              >
                Save
              </button>
              <button
                type="button"
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
                        mediaSlot: "loading-screen",
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
                          mediaSlot: "loading-screen",
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
