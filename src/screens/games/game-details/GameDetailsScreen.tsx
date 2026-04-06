import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { GameScreenshot } from "./types";
import "./index.css";

type FocusRegion = "launch" | "topbar";
type TopBarCta = "manage" | "back";
type LaunchAction = "quickstart" | "continue" | "load-rom" | "load-snapshot";

const TOP_BAR_CTAS: TopBarCta[] = ["manage", "back"];
const LAUNCH_ACTIONS: LaunchAction[] = [
  "quickstart",
  "continue",
  "load-rom",
  "load-snapshot",
];
const SCREENSHOT_SLOT_ORDER: Array<GameScreenshot["slot"]> = [
  "loading",
  "title",
  "gameplay",
];
const SCREENSHOT_CYCLE_MS = 3000;

function getActionLabel(action: LaunchAction): string {
  switch (action) {
    case "quickstart":
      return "Quickstart";
    case "continue":
      return "Continue";
    case "load-rom":
      return "Load ROM";
    case "load-snapshot":
      return "Load Snapshot";
  }
}

function getDisabledReason(action: LaunchAction, hasRom: boolean): string {
  switch (action) {
    case "quickstart":
      return "No quickstart snapshot available";
    case "continue":
      return "No eligible save snapshot available";
    case "load-rom":
      return hasRom
        ? ""
        : "ROM files not found. Use Manage to repair this game.";
    case "load-snapshot":
      return "No snapshots available";
  }
}

interface GameDetailsScreenProps {
  gameId: string;
}

export function GameDetailsScreen({ gameId }: GameDetailsScreenProps) {
  const { pop, push } = useRouter();
  const { store } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);

  const sortedScreenshots = game
    ? SCREENSHOT_SLOT_ORDER.flatMap((slot) => {
        const found = game.screenshots.find((s) => s.slot === slot);
        return found ? [found] : [];
      })
    : [];

  const [focusRegion, setFocusRegion] = useState<FocusRegion>("launch");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("manage");
  const [focusedAction, setFocusedAction] =
    useState<LaunchAction>("quickstart");
  const [screenshotIndex, setScreenshotIndex] = useState(0);
  const [bottomMessage, setBottomMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const manageButtonRef = useRef<HTMLAnchorElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Cycle screenshots automatically
  useEffect(() => {
    if (sortedScreenshots.length <= 1) return;
    const timer = setInterval(() => {
      setScreenshotIndex((prev) => (prev + 1) % sortedScreenshots.length);
    }, SCREENSHOT_CYCLE_MS);
    return () => clearInterval(timer);
  }, [sortedScreenshots.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleMainKey(event);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function isActionAvailable(action: LaunchAction): boolean {
    if (!game) return false;
    switch (action) {
      case "quickstart":
        return game.hasQuickstart && game.hasRom;
      case "continue":
        return game.hasContinue && game.hasRom;
      case "load-rom":
        return game.hasRom;
      case "load-snapshot":
        return game.hasAnySnapshot;
    }
  }

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
    handleLaunchKey(event);
  }

  function handleTopBarKey(event: KeyboardEvent) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const delta = event.key === "ArrowLeft" ? -1 : 1;
      const currentIndex = TOP_BAR_CTAS.indexOf(focusedCta);
      const nextIndex =
        (currentIndex + delta + TOP_BAR_CTAS.length) % TOP_BAR_CTAS.length;
      const nextCta = TOP_BAR_CTAS[nextIndex] as TopBarCta;
      setFocusedCta(nextCta);
      focusCtaButton(nextCta);
    } else if (event.key === "Enter") {
      if (focusedCta === "manage") {
        navigateToManage();
      } else {
        pop();
      }
    }
  }

  function handleLaunchKey(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      const currentIndex = LAUNCH_ACTIONS.indexOf(focusedAction);
      const nextIndex =
        (currentIndex - 1 + LAUNCH_ACTIONS.length) % LAUNCH_ACTIONS.length;
      const next = LAUNCH_ACTIONS[nextIndex] as LaunchAction;
      setFocusedAction(next);
      updateBottomBarForAction(next);
    } else if (event.key === "ArrowRight") {
      const currentIndex = LAUNCH_ACTIONS.indexOf(focusedAction);
      const nextIndex = (currentIndex + 1) % LAUNCH_ACTIONS.length;
      const next = LAUNCH_ACTIONS[nextIndex] as LaunchAction;
      setFocusedAction(next);
      updateBottomBarForAction(next);
    } else if (event.key === "Enter") {
      activateLaunchAction(focusedAction);
    }
  }

  function updateBottomBarForAction(action: LaunchAction) {
    if (isActionAvailable(action)) {
      setBottomMessage("");
    } else {
      const reason = game ? getDisabledReason(action, game.hasRom) : "";
      setBottomMessage(reason);
    }
  }

  function activateLaunchAction(action: LaunchAction) {
    if (!isActionAvailable(action)) {
      const reason = game ? getDisabledReason(action, game.hasRom) : "";
      setBottomMessage(reason);
      return;
    }
    if (action === "load-snapshot") {
      push("snapshot-list", { gameId });
    } else {
      push("now-playing", { gameId });
    }
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "launch") {
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
        setFocusRegion("launch");
        containerRef.current?.focus();
      }
    }
  }

  function focusCtaButton(cta: TopBarCta) {
    if (cta === "manage") {
      manageButtonRef.current?.focus();
    } else {
      backButtonRef.current?.focus();
    }
  }

  function navigateToManage() {
    push("game-management", { gameId });
  }

  function buildBottomBarText(): string {
    if (bottomMessage) return bottomMessage;
    return "";
  }

  const currentScreenshot = sortedScreenshots[screenshotIndex];

  if (!game) {
    return (
      <div
        role="application"
        className="screen"
        ref={containerRef}
        tabIndex={-1}
      >
        <div className="screen__topbar">
          <span className="screen__topbar-title">Game Details</span>
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
    <div role="application" className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{game.title}</span>
        <div className="screen__topbar-ctas">
          <a
            ref={manageButtonRef}
            href="#"
            className={`topbar-cta topbar-cta--nav${focusRegion === "topbar" && focusedCta === "manage" ? " topbar-cta--focused" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              navigateToManage();
            }}
          >
            Manage
          </a>
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
        <div className="game-details">
          <div className="game-details__info">
            {game.coverUrl ? (
              <img
                src={game.coverUrl}
                alt={`${game.title} cover`}
                className="game-details__cover"
              />
            ) : (
              <div className="game-details__cover-placeholder">No Cover</div>
            )}
            <div className="game-details__meta">
              <div className="game-details__title">{game.title}</div>
              <div className="game-details__publisher">{game.publisher}</div>
              <div className="game-details__year">{game.year}</div>
              {game.sources.length > 0 && (
                <div className="game-details__sources">
                  {game.sources
                    .map((s) => `${s.catalogueName}: ${s.entryId}`)
                    .join(", ")}
                </div>
              )}
              {game.notes && (
                <div className="game-details__notes">{game.notes}</div>
              )}
            </div>
            <div className="game-details__screenshots">
              {currentScreenshot ? (
                <img
                  src={currentScreenshot.url}
                  alt={`${game.title} ${currentScreenshot.slot} screen`}
                  className="game-details__screenshot"
                />
              ) : (
                <div className="game-details__screenshot-placeholder">
                  No screenshots
                </div>
              )}
            </div>
          </div>
          <div className="launch-bar">
            {LAUNCH_ACTIONS.map((action) => {
              const available = isActionAvailable(action);
              const focused =
                focusRegion === "launch" && focusedAction === action;
              let className = "launch-bar__action";
              if (focused) className += " launch-bar__action--focused";
              else if (available) className += " launch-bar__action--available";
              else className += " launch-bar__action--disabled";
              return (
                <button
                  key={action}
                  className={className}
                  disabled={!available}
                  onClick={() => activateLaunchAction(action)}
                  type="button"
                >
                  {getActionLabel(action)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="screen__bottombar">{buildBottomBarText()}</div>
    </div>
  );
}
