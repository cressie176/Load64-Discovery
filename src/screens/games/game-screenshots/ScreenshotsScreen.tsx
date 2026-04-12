import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { GameDetails } from "../game-details/types";
import type { MediaCandidate } from "../game-media-edit/types";
import "./index.css";

const MAX_CANDIDATES = 8;
const COLS = 3;
const GET_MEDIA_OPTIONS = ["From catalogue", "From URL", "From file"] as const;

type ScreenshotSlot = "loading" | "title" | "gameplay";
type FocusPanel = "slots" | "candidates" | "actions" | "topbar";
type TopBarCta = "back";
type Overlay = "get-media" | "context-menu";

const SLOT_ORDER: ScreenshotSlot[] = ["loading", "title", "gameplay"];
const TOP_BAR_CTAS: TopBarCta[] = ["back"];

export function deriveScreenTitle(
  importMode: boolean,
  gameTitle: string,
  importTitle?: string,
): string {
  if (importMode) {
    const title = importTitle ?? gameTitle;
    return `Import Games > ${title} > Media > Screenshots`;
  }
  return `${gameTitle} > Media > Screenshots`;
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

function findNextInRow(
  current: number,
  delta: number,
  candidateCount: number,
): number {
  let next = current + delta;
  if (next < 0) next = 0;
  if (next >= candidateCount) next = candidateCount - 1;
  return next < 0 ? 0 : next;
}

function findNextVertical(
  current: number,
  delta: number,
  candidateCount: number,
): number {
  if (candidateCount === 0) return 0;
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
  const [focusPanel, setFocusPanel] = useState<FocusPanel>("slots");
  const [focusedCandidateIndex, setFocusedCandidateIndex] = useState(0);
  const [focusedActionIndex, setFocusedActionIndex] = useState(0);
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("back");
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [overlayIndex, setOverlayIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);

  const candidateCount = localCandidates.length;
  const currentSlot = SLOT_ORDER[currentSlotIndex] ?? "loading";

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
    if (candidateCount === 0) return;
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
        setSlotAssignments((prev) => ({
          ...prev,
          [currentSlot]: candidate.url,
        }));
      }
    } else if (event.key === "Alt") {
      event.preventDefault();
      openContextMenu();
    }
  }

  // Actions: 0=Get Media, 1=Save, 2=Cancel
  function handleActionsKey(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      setFocusedActionIndex((prev) => Math.max(0, prev - 1));
    } else if (event.key === "ArrowRight") {
      setFocusedActionIndex((prev) => Math.min(2, prev + 1));
    } else if (event.key === "Enter") {
      activateAction(focusedActionIndex);
    }
  }

  function activateAction(index: number) {
    if (index === 0) openGetMediaOverlay();
    else if (index === 1) {
      if (Object.keys(slotAssignments).length > 0) handleSave();
    } else handleCancel();
  }

  function handleOverlayKey(event: KeyboardEvent) {
    if (event.key === "Escape") {
      setOverlay(null);
      return;
    }
    if (overlay === "get-media") {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setOverlayIndex((prev) => Math.max(0, prev - 1));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setOverlayIndex((prev) =>
          Math.min(GET_MEDIA_OPTIONS.length - 1, prev + 1),
        );
      } else if (event.key === "Enter") {
        const option = GET_MEDIA_OPTIONS[overlayIndex];
        setOverlay(null);
        handleGetMediaOption(option);
      }
    } else if (overlay === "context-menu") {
      if (event.key === "Enter") {
        setOverlay(null);
        removeCandidate(focusedCandidateIndex);
      }
    }
  }

  function handleGetMediaOption(option: (typeof GET_MEDIA_OPTIONS)[number]) {
    if (option === "From catalogue") {
      push("get-from-catalogue", { gameId });
    } else if (option === "From URL") {
      push("get-from-url", { gameId });
    } else {
      push("get-from-file", { gameId });
    }
  }

  function openGetMediaOverlay() {
    if (candidateCount >= MAX_CANDIDATES) return;
    setOverlay("get-media");
    setOverlayIndex(0);
  }

  function openContextMenu() {
    if (candidateCount > 0) {
      setOverlay("context-menu");
      setOverlayIndex(0);
    }
  }

  function removeCandidate(ci: number) {
    const newCandidates = localCandidates.filter((_, i) => i !== ci);
    setLocalCandidates(newCandidates);
    const newTotal = newCandidates.length;
    setFocusedCandidateIndex(newTotal === 0 ? 0 : Math.min(ci, newTotal - 1));
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
      } else if (candidateCount > 0) {
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

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">Media &gt; Screenshots</span>
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
            </div>
            <div className="screenshots__actions">
              <button
                type="button"
                className={`screenshots__action${focusPanel === "actions" && focusedActionIndex === 0 ? " screenshots__action--active" : ""}${candidateCount >= MAX_CANDIDATES ? " screenshots__action--disabled" : ""}`}
                disabled={candidateCount >= MAX_CANDIDATES}
                onClick={() => {
                  setFocusPanel("actions");
                  setFocusedActionIndex(0);
                  openGetMediaOverlay();
                }}
              >
                Get Media
              </button>
              <button
                type="button"
                className={`screenshots__action${focusPanel === "actions" && focusedActionIndex === 1 ? " screenshots__action--active" : ""}${Object.keys(slotAssignments).length === 0 ? " screenshots__action--disabled" : ""}`}
                disabled={Object.keys(slotAssignments).length === 0}
                onClick={handleSave}
              >
                Save
              </button>
              <button
                type="button"
                className={`screenshots__action${focusPanel === "actions" && focusedActionIndex === 2 ? " screenshots__action--active" : ""}`}
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="screen__bottombar" />
      {overlay === "get-media" && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">Get media</div>
            <ul className="overlay__list">
              {GET_MEDIA_OPTIONS.map((option, index) => (
                <li
                  key={option}
                  className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                  onClick={() => {
                    setOverlay(null);
                    handleGetMediaOption(option);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setOverlay(null);
                      handleGetMediaOption(option);
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
