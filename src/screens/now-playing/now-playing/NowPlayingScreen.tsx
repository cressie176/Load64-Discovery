import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { NowPlayingAction } from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";
type TopBarCta = "quit-game";

const TOP_BAR_CTAS: TopBarCta[] = ["quit-game"];
const ACTIONS: NowPlayingAction[] = [
  "resume",
  "view-controls",
  "swap-joystick",
  "swap-disks",
  "take-screenshot",
  "take-snapshot",
];

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
  }
}

function buildBottomBarMessage(
  action: NowPlayingAction,
  port1Name: string,
  port2Name: string,
  diskLabel: string | null,
): string {
  switch (action) {
    case "swap-joystick":
      return `Port 1: ${port1Name}  ◆  Port 2: ${port2Name}`;
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
  const { store, setStore } = useStore();

  const nowPlaying = store.nowPlaying;
  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const gameTitle = game?.title ?? nowPlaying.gameTitle;

  const gameplayScreenshot =
    game?.screenshots.find((s) => s.slot === "gameplay") ?? null;

  const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("quit-game");
  const [focusedAction, setFocusedAction] = useState<NowPlayingAction>(() => {
    const saved = currentParams.focusedAction;
    return (
      ACTIONS.includes(saved as NowPlayingAction) ? saved : ACTIONS[0]
    ) as NowPlayingAction;
  });
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [quitConfirmSelection, setQuitConfirmSelection] = useState<
    "no" | "yes"
  >("no");

  const containerRef = useRef<HTMLDivElement>(null);
  const quitButtonRef = useRef<HTMLButtonElement>(null);

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
    if (event.key === "Tab") {
      event.preventDefault();
      toggleFocusRegion(event.shiftKey);
      return;
    }
    if (event.key === "Escape") {
      return;
    }
    if (focusRegion === "topbar") {
      handleTopBarKey(event);
      return;
    }
    handleListKey(event);
  }

  function handleTopBarKey(event: KeyboardEvent) {
    if (event.key === "Enter") {
      if (focusedCta === "quit-game") {
        openQuitConfirm();
      }
    }
  }

  function handleListKey(event: KeyboardEvent) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const currentIndex = ACTIONS.indexOf(focusedAction);
      const nextIndex = (currentIndex - 1 + ACTIONS.length) % ACTIONS.length;
      setFocusedAction(ACTIONS[nextIndex] as NowPlayingAction);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const currentIndex = ACTIONS.indexOf(focusedAction);
      const nextIndex = (currentIndex + 1) % ACTIONS.length;
      setFocusedAction(ACTIONS[nextIndex] as NowPlayingAction);
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
    setFocusRegion("list");
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
      case "swap-joystick": {
        const {
          port1ControllerId,
          port1DeviceName,
          port2ControllerId,
          port2DeviceName,
        } = nowPlaying.joystickPorts;
        setStore((prev) => ({
          ...prev,
          nowPlaying: {
            ...prev.nowPlaying,
            joystickPorts: {
              port1ControllerId: port2ControllerId,
              port1DeviceName: port2DeviceName,
              port2ControllerId: port1ControllerId,
              port2DeviceName: port1DeviceName,
            },
          },
        }));
        break;
      }
      case "swap-disks":
        pushFrom({ focusedAction }, "now-playing-swap-disks", { gameId });
        break;
      case "take-screenshot":
        pushFrom({ focusedAction }, "now-playing-take-screenshot", { gameId });
        break;
      case "take-snapshot":
        pushFrom({ focusedAction }, "now-playing-take-snapshot", { gameId });
        break;
    }
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "list") {
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
        setFocusRegion("list");
        containerRef.current?.focus();
      }
    }
  }

  function focusCtaButton(cta: TopBarCta) {
    if (cta === "quit-game") {
      quitButtonRef.current?.focus();
    }
  }

  const { port1DeviceName, port2DeviceName } = nowPlaying.joystickPorts;
  const diskLabel = nowPlaying.activeDisk?.label ?? null;

  const bottomBarText = buildBottomBarMessage(
    focusedAction,
    port1DeviceName,
    port2DeviceName,
    diskLabel,
  );

  return (
    <div role="application" className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">
          Now Playing &gt; {gameTitle}
        </span>
        <div className="screen__topbar-ctas">
          <button
            ref={quitButtonRef}
            className={`topbar-cta${focusRegion === "topbar" && focusedCta === "quit-game" ? " topbar-cta--focused" : ""}`}
            onClick={openQuitConfirm}
            type="button"
          >
            [Quit Game]
          </button>
        </div>
      </div>
      <div className="screen__content">
        <div className="now-playing">
          <div className="now-playing__actions">
            <div className="now-playing__actions-label">Actions</div>
            <ul className="list">
              {ACTIONS.map((action) => {
                const selected =
                  focusRegion === "list" && focusedAction === action;
                return (
                  <li
                    key={action}
                    className={`list__row${selected ? " list__row--selected" : ""}`}
                  >
                    {getActionLabel(action)}
                  </li>
                );
              })}
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
