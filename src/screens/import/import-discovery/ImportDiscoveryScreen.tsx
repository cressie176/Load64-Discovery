import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { ImportSuggestion } from "./types";
import "./index.css";

type FocusRegion = "content" | "topbar";
type TopBarCta = "next" | "back";

function topBarCtas(hasGames: boolean): TopBarCta[] {
  return hasGames ? ["next", "back"] : ["back"];
}

function formatYear(year: number | null): string {
  return year !== null ? String(year) : "—";
}

function formatPublisher(publisher: string | null): string {
  return publisher ?? "—";
}

function formatTitle(suggestion: ImportSuggestion): string {
  return suggestion.title ?? "—";
}

export function ImportDiscoveryScreen() {
  const { pop, push } = useRouter();
  const { store } = useStore();
  const discovery = store.importDiscovery;

  const hasGames = discovery.games > 0;
  const ctas = topBarCtas(hasGames);

  const [focusRegion, setFocusRegion] = useState<FocusRegion>("content");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>(ctas[0]);

  const containerRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "content") {
      const cta = reverse ? ctas[ctas.length - 1] : ctas[0];
      setFocusRegion("topbar");
      setFocusedCta(cta);
      focusCtaButton(cta);
    } else {
      const currentIndex = ctas.indexOf(focusedCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < ctas.length) {
        const next = ctas[nextIndex];
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
    else backButtonRef.current?.focus();
  }

  function activateCta(cta: TopBarCta) {
    if (cta === "next") handleNext();
    else pop();
  }

  function handleNext() {
    push("import-candidate");
  }

  function ctaClassName(cta: TopBarCta): string {
    const focused = focusRegion === "topbar" && focusedCta === cta;
    return `topbar-cta${focused ? " topbar-cta--focused" : ""}`;
  }

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">Import Games &gt; Discover</span>
        <div className="screen__topbar-ctas">
          {hasGames && (
            <button
              ref={nextButtonRef}
              className={ctaClassName("next")}
              onClick={handleNext}
              type="button"
            >
              [Next]
            </button>
          )}
          <button
            ref={backButtonRef}
            className={ctaClassName("back")}
            onClick={pop}
            type="button"
          >
            [Back]
          </button>
        </div>
      </div>
      <div className="screen__content">
        <div className="import-discovery__summary">
          <div className="import-discovery__stat">
            <span className="import-discovery__stat-label">Games</span>
            <span className="import-discovery__stat-value">
              {discovery.games}
            </span>
          </div>
          <div className="import-discovery__stat">
            <span className="import-discovery__stat-label">Recognised</span>
            <span className="import-discovery__stat-value">
              {discovery.recognised}
            </span>
          </div>
          <div className="import-discovery__stat">
            <span className="import-discovery__stat-label">Unrecognised</span>
            <span className="import-discovery__stat-value">
              {discovery.unrecognised}
            </span>
          </div>
          <div className="import-discovery__stat">
            <span className="import-discovery__stat-label">Duplicates</span>
            <span className="import-discovery__stat-value">
              {discovery.duplicates}
            </span>
          </div>
          <div className="import-discovery__stat">
            <span className="import-discovery__stat-label">Ignored</span>
            <span className="import-discovery__stat-value">
              {discovery.ignored}
            </span>
          </div>
          {hasGames && (
            <div className="import-discovery__sample">
              <div className="import-discovery__sample-heading">Sample</div>
              <ul className="import-discovery__sample-list">
                <li className="import-discovery__sample-header">
                  <span className="import-discovery__col-title">Title</span>
                  <span className="import-discovery__col-publisher">
                    Publisher
                  </span>
                  <span className="import-discovery__col-year">Year</span>
                  <span className="import-discovery__col-roms">ROMs</span>
                </li>
                {discovery.sample.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    className="import-discovery__sample-row"
                  >
                    <span className="import-discovery__col-title">
                      {formatTitle(suggestion)}
                    </span>
                    <span className="import-discovery__col-publisher">
                      {formatPublisher(suggestion.publisher)}
                    </span>
                    <span className="import-discovery__col-year">
                      {formatYear(suggestion.year)}
                    </span>
                    <span className="import-discovery__col-roms">
                      {suggestion.romCount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="screen__bottombar">
        {!hasGames && "Nothing to import."}
      </div>
    </div>
  );
}
