import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { ImportCandidate } from "./types";
import "./index.css";

type FocusRegion = "content" | "topbar";
type TopBarCta = "next" | "skip" | "abort";
type OverlayOption = "yes" | "no";

const TOP_BAR_CTAS: TopBarCta[] = ["next", "skip", "abort"];
const OVERLAY_OPTIONS: OverlayOption[] = ["yes", "no"];

function deriveTitle(candidate: ImportCandidate): string {
  if (candidate.title !== null) return candidate.title;
  if (candidate.roms.length === 1) {
    const filename = candidate.roms[0].filename;
    return stripExtension(filename);
  }
  return commonPrefix(candidate.roms.map((r) => stripExtension(r.filename)));
}

function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot !== -1 ? filename.slice(0, dot) : filename;
}

function commonPrefix(names: string[]): string {
  if (names.length === 0) return "";
  let prefix = names[0];
  for (let i = 1; i < names.length; i++) {
    while (!names[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (prefix === "") return "";
    }
  }
  return prefix.replace(/[-_\s]+$/, "");
}

export function ImportCandidateScreen() {
  const { pop, push } = useRouter();
  const { store, setStore } = useStore();
  const { queue, currentIndex } = store.importCandidate;

  const candidate = queue[currentIndex] ?? null;
  const isRecognised = candidate !== null && candidate.title !== null;
  const screenTitle =
    candidate !== null
      ? `Import Games > ${deriveTitle(candidate)}`
      : "Import Games";

  const [focusRegion, setFocusRegion] = useState<FocusRegion>("content");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("next");
  const [showAbortOverlay, setShowAbortOverlay] = useState(false);
  const [overlayIndex, setOverlayIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const abortButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showAbortOverlay) {
        handleOverlayKey(event);
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        toggleFocusRegion(event.shiftKey);
        return;
      }
      if (event.key === "Escape") {
        pop();
        return;
      }
      if (focusRegion === "topbar" && event.key === "Enter") {
        activateCta(focusedCta);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleOverlayKey(event: KeyboardEvent) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOverlayIndex((i) => Math.max(0, i - 1));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setOverlayIndex((i) => Math.min(OVERLAY_OPTIONS.length - 1, i + 1));
    } else if (event.key === "Enter") {
      const option = OVERLAY_OPTIONS[overlayIndex];
      if (option === "yes") {
        abortImport();
      } else {
        setShowAbortOverlay(false);
      }
    } else if (event.key === "Escape") {
      setShowAbortOverlay(false);
    }
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "content") {
      const cta = reverse
        ? TOP_BAR_CTAS[TOP_BAR_CTAS.length - 1]
        : TOP_BAR_CTAS[0];
      setFocusRegion("topbar");
      setFocusedCta(cta);
      focusCtaButton(cta);
    } else {
      const currentIdx = TOP_BAR_CTAS.indexOf(focusedCta);
      const nextIdx = currentIdx + (reverse ? -1 : 1);
      if (nextIdx >= 0 && nextIdx < TOP_BAR_CTAS.length) {
        const next = TOP_BAR_CTAS[nextIdx] as TopBarCta;
        setFocusedCta(next);
        focusCtaButton(next);
      } else {
        setFocusRegion("content");
        containerRef.current?.focus();
      }
    }
  }

  function focusCtaButton(cta: TopBarCta) {
    if (cta === "next") nextButtonRef.current?.focus();
    else if (cta === "skip") skipButtonRef.current?.focus();
    else abortButtonRef.current?.focus();
  }

  function activateCta(cta: TopBarCta) {
    if (cta === "next") handleNext();
    else if (cta === "skip") handleSkip();
    else handleAbort();
  }

  function handleNext() {
    push("game-catalogue-sources-list");
  }

  function handleSkip() {
    advanceQueue();
  }

  function handleAbort() {
    setShowAbortOverlay(true);
    setOverlayIndex(0);
  }

  function abortImport() {
    setStore((prev) => ({
      ...prev,
      importCandidate: { ...prev.importCandidate, currentIndex: 0 },
    }));
    // Navigate back to Import Games screen (pop until we reach it)
    pop();
    pop();
    pop();
  }

  function advanceQueue() {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      setStore((prev) => ({
        ...prev,
        importCandidate: { ...prev.importCandidate, currentIndex: 0 },
      }));
      pop();
      pop();
    } else {
      setStore((prev) => ({
        ...prev,
        importCandidate: { ...prev.importCandidate, currentIndex: nextIndex },
      }));
    }
  }

  function ctaClassName(cta: TopBarCta): string {
    const focused = focusRegion === "topbar" && focusedCta === cta;
    return `topbar-cta topbar-cta--action${focused ? " topbar-cta--focused" : ""}`;
  }

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
        <div className="screen__topbar-ctas">
          <button
            ref={nextButtonRef}
            className={ctaClassName("next")}
            onClick={handleNext}
            type="button"
          >
            Next
          </button>
          <button
            ref={skipButtonRef}
            className={ctaClassName("skip")}
            onClick={handleSkip}
            type="button"
          >
            Skip
          </button>
          <button
            ref={abortButtonRef}
            className={ctaClassName("abort")}
            onClick={handleAbort}
            type="button"
          >
            Abort
          </button>
        </div>
      </div>
      <div className="screen__content">
        {candidate !== null && (
          <>
            {isRecognised && (
              <div>
                <div className="import-candidate__section-heading">Summary</div>
                <div className="import-candidate__summary">
                  <div className="import-candidate__summary-row">
                    <span className="import-candidate__summary-label">
                      Title
                    </span>
                    <span className="import-candidate__summary-value">
                      {candidate.title}
                    </span>
                  </div>
                  <div className="import-candidate__summary-row">
                    <span className="import-candidate__summary-label">
                      Publisher
                    </span>
                    <span className="import-candidate__summary-value">
                      {candidate.publisher ?? "—"}
                    </span>
                  </div>
                  <div className="import-candidate__summary-row">
                    <span className="import-candidate__summary-label">
                      Year
                    </span>
                    <span className="import-candidate__summary-value">
                      {candidate.year !== null ? String(candidate.year) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div>
              <div className="import-candidate__section-heading">ROMs</div>
              <div className="import-candidate__roms">
                <div className="import-candidate__roms-header">
                  <span className="import-candidate__col-label">Label</span>
                  <span className="import-candidate__col-filename">
                    Filename
                  </span>
                </div>
                {candidate.roms.map((rom) => (
                  <div
                    key={rom.filename}
                    className="import-candidate__roms-row"
                  >
                    <span className="import-candidate__col-label">
                      {rom.label}
                    </span>
                    <span className="import-candidate__col-filename">
                      {rom.filename}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="screen__bottombar">
        {candidate !== null && !isRecognised
          ? "Not found in the Load!64 Catalogue — Add details on the next screens."
          : ""}
      </div>
      {showAbortOverlay && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">Abort import?</div>
            <p className="import-candidate__overlay-body">
              Remaining games will not be imported.
            </p>
            <ul className="overlay__list">
              {OVERLAY_OPTIONS.map((option, index) => (
                <li
                  key={option}
                  className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                >
                  {option === "yes" ? "Yes" : "No"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
