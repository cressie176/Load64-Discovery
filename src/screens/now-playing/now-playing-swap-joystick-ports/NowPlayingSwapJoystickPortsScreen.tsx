import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "content" | "topbar";
type TopBarCta = "back";

const TOP_BAR_CTAS: TopBarCta[] = ["back"];

interface NowPlayingSwapJoystickPortsScreenProps {
  gameId: string;
}

export function NowPlayingSwapJoystickPortsScreen({
  gameId,
}: NowPlayingSwapJoystickPortsScreenProps) {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const nowPlaying = store.nowPlaying;
  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const gameTitle = game?.title ?? nowPlaying.gameTitle;

  const { port1DeviceName, port2DeviceName } = nowPlaying.joystickPorts;

  const [focusRegion, setFocusRegion] = useState<FocusRegion>("content");
  const [focusedTopBarCta, setFocusedTopBarCta] = useState<TopBarCta>("back");

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);

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
      if (event.key === "Enter" && focusedTopBarCta === "back") {
        pop();
      }
      return;
    }
    if (event.key === "Enter") {
      swapPorts();
    }
  }

  function swapPorts() {
    const {
      port1ControllerId,
      port1DeviceName: p1Name,
      port2ControllerId,
      port2DeviceName: p2Name,
    } = nowPlaying.joystickPorts;
    setStore((prev) => ({
      ...prev,
      nowPlaying: {
        ...prev.nowPlaying,
        joystickPorts: {
          port1ControllerId: port2ControllerId,
          port1DeviceName: p2Name,
          port2ControllerId: port1ControllerId,
          port2DeviceName: p1Name,
        },
      },
    }));
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "content") {
      const cta = reverse
        ? TOP_BAR_CTAS[TOP_BAR_CTAS.length - 1]
        : TOP_BAR_CTAS[0];
      setFocusRegion("topbar");
      setFocusedTopBarCta(cta as TopBarCta);
      backButtonRef.current?.focus();
    } else {
      const currentIndex = TOP_BAR_CTAS.indexOf(focusedTopBarCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < TOP_BAR_CTAS.length) {
        const nextCta = TOP_BAR_CTAS[nextIndex] as TopBarCta;
        setFocusedTopBarCta(nextCta);
        backButtonRef.current?.focus();
      } else {
        setFocusRegion("content");
        containerRef.current?.focus();
      }
    }
  }

  return (
    <div role="application" className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">
          Now Playing &gt; {gameTitle} &gt; Swap Joystick Ports
        </span>
        <div className="screen__topbar-ctas">
          <a
            ref={backButtonRef}
            href="#"
            className={`topbar-cta topbar-cta--nav${focusRegion === "topbar" && focusedTopBarCta === "back" ? " topbar-cta--focused" : ""}`}
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
        <div className="swap-joystick-ports">
          <div className="swap-joystick-ports__section-label">Joysticks</div>
          <ul className="list">
            <li className="list__header">
              <span className="swap-joystick-ports__col--port">Port</span>
              <span className="swap-joystick-ports__col--joystick">
                Joystick
              </span>
            </li>
            <li className="list__row">
              <span className="swap-joystick-ports__col--port">Port 1</span>
              <span className="swap-joystick-ports__col--joystick">
                {port1DeviceName}
              </span>
            </li>
            <li className="list__row">
              <span className="swap-joystick-ports__col--port">Port 2</span>
              <span className="swap-joystick-ports__col--joystick">
                {port2DeviceName}
              </span>
            </li>
          </ul>
          <div className="swap-joystick-ports__actions">
            <button
              type="button"
              className={`swap-joystick-ports__btn${focusRegion === "content" ? " swap-joystick-ports__btn--focused" : ""}`}
              onClick={swapPorts}
            >
              Swap
            </button>
          </div>
        </div>
      </div>
      <div className="screen__bottombar" />
    </div>
  );
}
