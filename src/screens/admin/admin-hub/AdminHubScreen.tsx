import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import {
  ADMIN_HUB_ITEMS,
  ADMIN_HUB_ROWS,
  type AdminHubItem,
  QUIT_OPTIONS,
  wrapIndex,
} from "./items";

type FocusRegion = "list" | "topbar";

export function AdminHubScreen() {
  const { pop, pushFrom, currentParams } = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const saved = Number(currentParams.selectedIndex);
    return Number.isFinite(saved) && saved >= 0 ? saved : 0;
  });
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
  const [showQuitOverlay, setShowQuitOverlay] = useState(false);
  const [quitSelectedIndex, setQuitSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showQuitOverlay) {
        handleQuitOverlayKey(event);
        return;
      }
      handleMainKey(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleQuitOverlayKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setQuitSelectedIndex((prev) => wrapIndex(prev, 1, QUIT_OPTIONS.length));
    } else if (event.key === "ArrowUp") {
      setQuitSelectedIndex((prev) => wrapIndex(prev, -1, QUIT_OPTIONS.length));
    } else if (event.key === "Enter") {
      if (quitSelectedIndex === 0) {
        pop();
      } else {
        setShowQuitOverlay(false);
      }
    } else if (event.key === "Escape") {
      setShowQuitOverlay(false);
    }
  }

  function handleMainKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      if (focusRegion === "list") {
        setFocusRegion("topbar");
        backButtonRef.current?.focus();
      } else {
        setFocusRegion("list");
        containerRef.current?.focus();
      }
      return;
    }
    if (event.key === "Escape") {
      pop();
      return;
    }
    if (focusRegion === "topbar") {
      if (event.key === "Enter") {
        pop();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      setSelectedIndex((prev) => wrapIndex(prev, 1, ADMIN_HUB_ITEMS.length));
    } else if (event.key === "ArrowUp") {
      setSelectedIndex((prev) => wrapIndex(prev, -1, ADMIN_HUB_ITEMS.length));
    } else if (event.key === "Enter") {
      activateItem(ADMIN_HUB_ITEMS[selectedIndex]);
    }
  }

  function activateItem(item: AdminHubItem | undefined) {
    if (!item) return;
    if (item.action === "quit") {
      setShowQuitOverlay(true);
      setQuitSelectedIndex(0);
      return;
    }
    pushFrom({ selectedIndex: String(selectedIndex) }, item.screen);
  }

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">Admin</span>
        <div className="screen__topbar-ctas">
          <button
            ref={backButtonRef}
            className={`topbar-cta${focusRegion === "topbar" ? " topbar-cta--focused" : ""}`}
            onClick={pop}
            type="button"
          >
            [Back]
          </button>
        </div>
      </div>
      <div className="screen__content">
        <ul className="list">
          {ADMIN_HUB_ROWS.map((row) => {
            if (row.kind === "group-header") {
              return (
                <li className="list__group-header" key={row.label}>
                  {row.label}
                </li>
              );
            }
            const itemIndex = ADMIN_HUB_ITEMS.indexOf(row.item);
            return (
              <li
                className={`list__row${itemIndex === selectedIndex && focusRegion === "list" ? " list__row--selected" : ""}`}
                key={row.item.label}
              >
                {row.item.label}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="screen__bottombar" />
      {showQuitOverlay && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">Quit Load!64?</div>
            <ul className="overlay__list">
              {QUIT_OPTIONS.map((option, index) => (
                <li
                  className={`overlay__row${index === quitSelectedIndex ? " overlay__row--selected" : ""}`}
                  key={option}
                >
                  {option}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
