import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import {
  buildImportQueue,
  formatPublisher,
  formatTitle,
  formatYear,
  selectionCount,
} from "./helpers";
import type { DiscoveredGame } from "./types";
import "./index.css";

type Tab = "new" | "already-imported";
type FocusRegion = "tabs" | "controls" | "games" | "topbar";
type Control = "select-all" | "select-none";
type TopBarCta = "next" | "back";

const TOP_BAR_CTAS: TopBarCta[] = ["next", "back"];

export function ImportDiscoveryScreen() {
  const { pop, push } = useRouter();
  const { store, setStore } = useStore();

  const [games, setGames] = useState<DiscoveredGame[]>(
    store.importDiscovery.games,
  );
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("games");
  const [focusedControl, setFocusedControl] = useState<Control>("select-all");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("next");
  const [focusedGameIndex, setFocusedGameIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const hasNew = games.some((g) => !g.alreadyImported);
  const hasAlreadyImported = games.some((g) => g.alreadyImported);
  const hasBoth = hasNew && hasAlreadyImported;
  const hasAny = games.length > 0;
  const allAlreadyImported = hasAny && !hasNew;

  const visibleTab: Tab = hasBoth
    ? activeTab
    : hasAlreadyImported
      ? "already-imported"
      : "new";
  const visibleGames = games.filter((g) =>
    visibleTab === "new" ? !g.alreadyImported : g.alreadyImported,
  );

  const newCount = games.filter((g) => !g.alreadyImported).length;
  const alreadyImportedCount = games.filter((g) => g.alreadyImported).length;
  const totalSelected = selectionCount(games);
  const importEnabled = store.importDiscovery.scanComplete && totalSelected > 0;

  const topBarCtas: TopBarCta[] = hasAny ? TOP_BAR_CTAS : ["back"];
  const clampedGameIndex = Math.min(
    focusedGameIndex,
    Math.max(0, visibleGames.length - 1),
  );

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
      if (focusRegion === "topbar") {
        handleTopBarKey(event);
      } else if (focusRegion === "tabs") {
        handleTabsKey(event);
      } else if (focusRegion === "controls") {
        handleControlsKey(event);
      } else {
        handleGamesKey(event);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleTopBarKey(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      activateCta(focusedCta);
    }
  }

  function handleControlsKey(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setFocusedControl("select-all");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setFocusedControl("select-none");
    } else if (event.key === "ArrowUp" && hasBoth) {
      event.preventDefault();
      setFocusRegion("tabs");
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusRegion("games");
      setFocusedGameIndex(0);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (focusedControl === "select-all") selectAll();
      else selectNone();
    }
  }

  function handleGamesKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedGameIndex((i) => Math.min(i + 1, visibleGames.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (clampedGameIndex === 0) {
        setFocusRegion("controls");
      } else {
        setFocusedGameIndex((i) => i - 1);
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      toggleRowSelection(clampedGameIndex);
    }
  }

  function handleTabsKey(event: KeyboardEvent) {
    if (event.key === "ArrowLeft" && hasBoth) {
      event.preventDefault();
      setActiveTab("new");
    } else if (event.key === "ArrowRight" && hasBoth) {
      event.preventDefault();
      setActiveTab("already-imported");
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusRegion("controls");
    }
  }

  function toggleFocusRegion(reverse = false) {
    if (
      focusRegion === "tabs" ||
      focusRegion === "controls" ||
      focusRegion === "games"
    ) {
      const cta = reverse ? topBarCtas[topBarCtas.length - 1] : topBarCtas[0];
      setFocusRegion("topbar");
      setFocusedCta(cta);
      focusCtaButton(cta);
    } else {
      const currentIndex = topBarCtas.indexOf(focusedCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < topBarCtas.length) {
        const next = topBarCtas[nextIndex];
        setFocusedCta(next);
        focusCtaButton(next);
      } else {
        setFocusRegion("games");
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
    if (!importEnabled) return;
    const queue = buildImportQueue(games);
    setStore((prev) => ({
      ...prev,
      importCandidate: { queue, currentIndex: 0 },
    }));
    push("import-candidate");
  }

  function toggleRowSelection(gameIndex: number) {
    const game = visibleGames[gameIndex];
    if (!game) return;
    setGames((prev) =>
      prev.map((g) => (g.id === game.id ? { ...g, selected: !g.selected } : g)),
    );
  }

  function selectAll() {
    setGames((prev) =>
      prev.map((g) => {
        const inCurrentTab =
          visibleTab === "new" ? !g.alreadyImported : g.alreadyImported;
        return inCurrentTab ? { ...g, selected: true } : g;
      }),
    );
  }

  function selectNone() {
    setGames((prev) =>
      prev.map((g) => {
        const inCurrentTab =
          visibleTab === "new" ? !g.alreadyImported : g.alreadyImported;
        return inCurrentTab ? { ...g, selected: false } : g;
      }),
    );
  }

  function ctaClassName(cta: TopBarCta): string {
    const focused = focusRegion === "topbar" && focusedCta === cta;
    return `topbar-cta topbar-cta--nav${focused ? " topbar-cta--focused" : ""}`;
  }

  function tabClassName(tab: Tab): string {
    const active = visibleTab === tab;
    const focused = focusRegion === "tabs" && visibleTab === tab;
    return [
      "import-discovery__tab",
      active ? "import-discovery__tab--active" : "",
      focused ? "import-discovery__tab--focused" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function controlClassName(control: Control): string {
    const focused = focusRegion === "controls" && focusedControl === control;
    return `import-discovery__control${focused ? " import-discovery__control--focused" : ""}`;
  }

  function bottomBarMessage(): string {
    if (!hasAny) return "Nothing to import.";
    if (allAlreadyImported) return "Nothing new to import.";
    return `${totalSelected} of ${games.length} selected`;
  }

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">Import Games &gt; Discover</span>
        <div className="screen__topbar-ctas">
          {hasAny && (
            <button
              ref={nextButtonRef}
              className={ctaClassName("next")}
              disabled={!importEnabled}
              onClick={handleNext}
              type="button"
            >
              Next
            </button>
          )}
          <button
            ref={backButtonRef}
            className={ctaClassName("back")}
            onClick={pop}
            type="button"
          >
            Back
          </button>
        </div>
      </div>
      <div className="screen__content">
        {hasAny && (
          <div className="import-discovery__checklist">
            {hasBoth && (
              <div className="import-discovery__tabs">
                <button
                  className={tabClassName("new")}
                  onClick={() => {
                    setActiveTab("new");
                    setFocusRegion("tabs");
                  }}
                  type="button"
                >
                  New ({newCount})
                </button>
                <button
                  className={tabClassName("already-imported")}
                  onClick={() => {
                    setActiveTab("already-imported");
                    setFocusRegion("tabs");
                  }}
                  type="button"
                >
                  Already Imported ({alreadyImportedCount})
                </button>
              </div>
            )}
            <div className="import-discovery__controls">
              <button
                className={controlClassName("select-all")}
                onClick={() => {
                  setFocusRegion("controls");
                  setFocusedControl("select-all");
                  selectAll();
                }}
                type="button"
              >
                Select All
              </button>
              <button
                className={controlClassName("select-none")}
                onClick={() => {
                  setFocusRegion("controls");
                  setFocusedControl("select-none");
                  selectNone();
                }}
                type="button"
              >
                Select None
              </button>
            </div>
            <ul className="list import-discovery__list">
              <li className="list__header import-discovery__header">
                <span className="import-discovery__col-check" />
                <span className="import-discovery__col-title">Title</span>
                <span className="import-discovery__col-publisher">
                  Publisher
                </span>
                <span className="import-discovery__col-year">Year</span>
              </li>
              {visibleGames.map((game, index) => {
                const isRowFocused =
                  focusRegion === "games" && index === clampedGameIndex;
                return (
                  <li
                    key={game.id}
                    className={`list__row import-discovery__row${isRowFocused ? " list__row--selected" : ""}`}
                    onClick={() => {
                      setFocusRegion("games");
                      setFocusedGameIndex(index);
                      toggleRowSelection(index);
                    }}
                    onKeyDown={() => {}}
                  >
                    <span className="import-discovery__col-check">
                      {game.selected ? "[x]" : "[ ]"}
                    </span>
                    <span className="import-discovery__col-title">
                      {formatTitle(game)}
                    </span>
                    <span className="import-discovery__col-publisher">
                      {formatPublisher(game.publisher)}
                    </span>
                    <span className="import-discovery__col-year">
                      {formatYear(game.year)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <div className="screen__bottombar">{bottomBarMessage()}</div>
    </div>
  );
}
