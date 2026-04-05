import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { Binary } from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";
type TopbarCta = "discover" | "back";

const TOPBAR_CTAS: TopbarCta[] = ["discover", "back"];

function statusSymbol(binary: Binary): string {
  if (binary.status === "valid") return "✓";
  if (binary.status === "invalid") return "✗";
  return "—";
}

function statusClass(binary: Binary): string {
  if (binary.status === "valid")
    return "binary-list__status binary-list__status--valid";
  if (binary.status === "invalid")
    return "binary-list__status binary-list__status--invalid";
  return "binary-list__status";
}

function deriveBottomBarMessage(binary: Binary | undefined): string {
  if (!binary) return "";
  if (binary.status === "invalid" && binary.statusReason) {
    return `${binary.statusReason}. Games on this platform will be unlaunchable.`;
  }
  return "";
}

export function BinaryListScreen() {
  const { pop, push } = useRouter();
  const { store, setStore } = useStore();
  const binaries = store.binaries;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
  const [topbarCtaIndex, setTopbarCtaIndex] = useState(0);
  const [discoveryMessage] = useState(() => {
    const message = store.discoveryMessage;
    if (message) {
      setStore((prev) => ({ ...prev, discoveryMessage: "" }));
    }
    return message;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const discoverButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleKey(event);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleKey(event: KeyboardEvent) {
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
      handleTopbarKey(event);
      return;
    }
    handleListKey(event);
  }

  function toggleFocusRegion(reverse: boolean) {
    if (focusRegion === "list") {
      setFocusRegion("topbar");
      const ctaIndex = reverse ? TOPBAR_CTAS.length - 1 : 0;
      setTopbarCtaIndex(ctaIndex);
      focusTopbarCta(TOPBAR_CTAS[ctaIndex] as TopbarCta);
    } else {
      const next = reverse ? topbarCtaIndex - 1 : topbarCtaIndex + 1;
      if (next >= 0 && next < TOPBAR_CTAS.length) {
        setTopbarCtaIndex(next);
        focusTopbarCta(TOPBAR_CTAS[next] as TopbarCta);
      } else {
        setFocusRegion("list");
        containerRef.current?.focus();
      }
    }
  }

  function focusTopbarCta(cta: TopbarCta) {
    if (cta === "discover") {
      discoverButtonRef.current?.focus();
    } else {
      backButtonRef.current?.focus();
    }
  }

  function handleTopbarKey(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      const next =
        (topbarCtaIndex - 1 + TOPBAR_CTAS.length) % TOPBAR_CTAS.length;
      setTopbarCtaIndex(next);
      focusTopbarCta(TOPBAR_CTAS[next] as TopbarCta);
    } else if (event.key === "ArrowRight") {
      const next = (topbarCtaIndex + 1) % TOPBAR_CTAS.length;
      setTopbarCtaIndex(next);
      focusTopbarCta(TOPBAR_CTAS[next] as TopbarCta);
    } else if (event.key === "Enter") {
      activateTopbarCta(TOPBAR_CTAS[topbarCtaIndex] as TopbarCta);
    }
  }

  function activateTopbarCta(cta: TopbarCta) {
    if (cta === "back") {
      pop();
    } else if (cta === "discover") {
      push("binary-discover");
    }
  }

  function handleListKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev + 1) % binaries.length);
    } else if (event.key === "ArrowUp") {
      setSelectedIndex(
        (prev) => (prev - 1 + binaries.length) % binaries.length,
      );
    } else if (event.key === "Enter") {
      const binary = binaries[selectedIndex];
      if (binary) push("binary-edit", { machineName: binary.machineName });
    }
  }

  const focusedBinary = binaries[selectedIndex];
  const bottomBarMessage =
    discoveryMessage || deriveBottomBarMessage(focusedBinary);

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">Binaries</span>
        <div className="screen__topbar-ctas">
          <button
            ref={discoverButtonRef}
            className={`topbar-cta${focusRegion === "topbar" && topbarCtaIndex === 0 ? " topbar-cta--focused" : ""}`}
            onClick={() => push("binary-discover")}
            type="button"
          >
            [Discover]
          </button>
          <button
            ref={backButtonRef}
            className={`topbar-cta${focusRegion === "topbar" && topbarCtaIndex === 1 ? " topbar-cta--focused" : ""}`}
            onClick={pop}
            type="button"
          >
            [Back]
          </button>
        </div>
      </div>
      <div className="screen__content">
        <div className="list__header">
          <div className="binary-list__header">
            <span>Machine</span>
            <span>Path</span>
            <span>Status</span>
          </div>
        </div>
        <ul className="list">
          {binaries.map((binary, index) => (
            <li
              key={binary.machineName}
              className={`list__row${index === selectedIndex && focusRegion === "list" ? " list__row--selected" : ""}`}
            >
              <div className="binary-list__row">
                <span className="binary-list__machine">
                  {binary.machineName}
                </span>
                <span
                  className={`binary-list__path${binary.path ? " binary-list__path--configured" : ""}`}
                >
                  {binary.path ?? "—"}
                </span>
                <span className={statusClass(binary)}>
                  {statusSymbol(binary)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="screen__bottombar">{bottomBarMessage}</div>
    </div>
  );
}
