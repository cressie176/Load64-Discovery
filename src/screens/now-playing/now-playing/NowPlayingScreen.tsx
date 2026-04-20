import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { NowPlayingAction } from "./types";
import "./index.css";

const MAIN_ACTIONS: NowPlayingAction[] = [
  "resume",
  "view-controls",
  "swap-joystick",
  "swap-disks",
  "take-screenshot",
  "take-snapshot",
];
const DANGER_ACTIONS: NowPlayingAction[] = ["quit-game"];
const ACTIONS: NowPlayingAction[] = [...MAIN_ACTIONS, ...DANGER_ACTIONS];

function getActionLabel(action: NowPlayingAction): string {
  switch (action) {
    case "resume":
      return "Resume Game";
    case "view-controls":
      return "View controls";
    case "swap-joystick":
      return "Swap joystick ports";
    case "swap-disks":
      return "Swap disks";
    case "take-screenshot":
      return "Take screenshot";
    case "take-snapshot":
      return "Take snapshot";
    case "quit-game":
      return "Quit Game";
  }
}

function buildBottomBarMessage(
  action: NowPlayingAction,
  diskLabel: string | null,
): string {
  switch (action) {
    case "swap-disks":
      return diskLabel !== null ? `Current: ${diskLabel}` : "";
    default:
      return "";
  }
}

interface NowPlayingScreenProps {
  gameId: string;
}

export function NowPlayingScreen({ gameId }: NowPlayingScreenProps) {
  const { pop, push, pushFrom, currentParams } = useRouter();
  const { store } = useStore();

  const nowPlaying = store.nowPlaying;
  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const gameTitle = game?.title ?? nowPlaying.gameTitle;

  const gameplayScreenshot =
    game?.screenshots.find((s) => s.slot === "gameplay") ?? null;

  const [focusedAction, setFocusedAction] = useState<NowPlayingAction>(() => {
    const saved = currentParams.focusedAction;
    return (
      ACTIONS.includes(saved as NowPlayingAction) ? saved : ACTIONS[0]
    ) as NowPlayingAction;
  });
  const [outcomeMessage, setOutcomeMessage] = useState(
    currentParams.outcomeMessage ?? "",
  );
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [quitConfirmSelection, setQuitConfirmSelection] = useState<
    "no" | "yes"
  >("no");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleMainKey(event);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleMainKey(event: KeyboardEvent) {
    if (showQuitConfirm) {
      handleQuitConfirmKey(event);
      return;
    }
    if (event.key === "Escape") {
      return;
    }
    handleListKey(event);
  }

  function handleListKey(event: KeyboardEvent) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const currentIndex = ACTIONS.indexOf(focusedAction);
      const nextIndex = (currentIndex - 1 + ACTIONS.length) % ACTIONS.length;
      setFocusedAction(ACTIONS[nextIndex] as NowPlayingAction);
      setOutcomeMessage("");
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const currentIndex = ACTIONS.indexOf(focusedAction);
      const nextIndex = (currentIndex + 1) % ACTIONS.length;
      setFocusedAction(ACTIONS[nextIndex] as NowPlayingAction);
      setOutcomeMessage("");
    } else if (event.key === "Enter") {
      activateAction(focusedAction);
    }
  }

  function handleQuitConfirmKey(event: KeyboardEvent) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      setQuitConfirmSelection((prev) => (prev === "no" ? "yes" : "no"));
    } else if (event.key === "Enter") {
      if (quitConfirmSelection === "yes") {
        quitGame();
      } else {
        closeQuitConfirm();
      }
    } else if (event.key === "Escape") {
      closeQuitConfirm();
    }
  }

  function openQuitConfirm() {
    setQuitConfirmSelection("no");
    setShowQuitConfirm(true);
  }

  function closeQuitConfirm() {
    setShowQuitConfirm(false);
    containerRef.current?.focus();
  }

  function quitGame() {
    setShowQuitConfirm(false);
    pop();
  }

  function activateAction(action: NowPlayingAction) {
    switch (action) {
      case "resume":
        break;
      case "view-controls":
        push("control-list", {
          ownerId: nowPlaying.joystickPorts.port1ControllerId,
        });
        break;
      case "swap-joystick":
        pushFrom({ focusedAction }, "now-playing-swap-joystick-ports", {
          gameId,
        });
        break;
      case "swap-disks":
        pushFrom({ focusedAction }, "now-playing-swap-disks", { gameId });
        break;
      case "take-screenshot":
        pushFrom({ focusedAction }, "now-playing-take-screenshot", { gameId });
        break;
      case "take-snapshot":
        pushFrom({ focusedAction }, "now-playing-take-snapshot", { gameId });
        break;
      case "quit-game":
        openQuitConfirm();
        break;
    }
  }

  const diskLabel = nowPlaying.activeDisk?.label ?? null;

  const bottomBarText =
    outcomeMessage || buildBottomBarMessage(focusedAction, diskLabel);

  function renderActionRow(action: NowPlayingAction) {
    const selected = focusedAction === action;
    return (
      <li
        key={action}
        className={`list__row${selected ? " list__row--selected" : ""}`}
      >
        {getActionLabel(action)}
      </li>
    );
  }

  return (
    <div role="application" className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">
          Now Playing &gt; {gameTitle}
        </span>
      </div>
      <div className="screen__content">
        <div className="now-playing">
          <div className="now-playing__actions">
            <div className="now-playing__actions-label">Actions</div>
            <ul className="list">
              {MAIN_ACTIONS.map((action) => renderActionRow(action))}
              <li className="list__group-header list__group-header--danger">
                DANGER ZONE
              </li>
              {DANGER_ACTIONS.map((action) => renderActionRow(action))}
            </ul>
          </div>
          <div className="now-playing__preview">
            <div className="now-playing__preview-label">Preview</div>
            {gameplayScreenshot ? (
              <img
                src={gameplayScreenshot.url}
                alt={`${gameTitle} gameplay`}
                className="now-playing__preview-image"
              />
            ) : nowPlaying.gameplayScreenshotUrl ? (
              <img
                src={nowPlaying.gameplayScreenshotUrl}
                alt={`${gameTitle} gameplay`}
                className="now-playing__preview-image"
              />
            ) : (
              <div className="now-playing__preview-placeholder">No preview</div>
            )}
          </div>
        </div>
      </div>
      <div className="screen__bottombar">{bottomBarText}</div>

      {showQuitConfirm && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">Quit game?</div>
            <p style={{ marginBottom: "16px", fontSize: "12px" }}>
              VICE will close and you will return to Load!64.
            </p>
            <ul className="overlay__list">
              <li
                className={`overlay__row${quitConfirmSelection === "no" ? " overlay__row--selected" : ""}`}
              >
                No
              </li>
              <li
                className={`overlay__row${quitConfirmSelection === "yes" ? " overlay__row--selected" : ""}`}
              >
                Yes
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
