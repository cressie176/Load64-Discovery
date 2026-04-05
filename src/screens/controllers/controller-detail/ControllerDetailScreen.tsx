import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { ControllerDetailItem } from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";

const ITEMS: ControllerDetailItem[] = [
  "family",
  "controls",
  "environment-variables",
];

function labelFor(item: ControllerDetailItem): string {
  if (item === "family") return "Family";
  if (item === "controls") return "Controls";
  return "Environment Variables";
}

function wrapIndex(index: number, delta: number, length: number): number {
  return (index + delta + length) % length;
}

interface ControllerDetailScreenProps {
  controllerId: string;
  statusMessage?: string;
}

export function ControllerDetailScreen({
  controllerId,
  statusMessage: initialStatusMessage = "",
}: ControllerDetailScreenProps) {
  const { pop, pushFrom, currentParams } = useRouter();
  const { store } = useStore();

  const controller = store.controllers.find((c) => c.id === controllerId);

  const isConnected = (controller?.connectedCount ?? 0) > 0;
  const deviceName = controller?.name ?? controllerId;

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const saved = Number(currentParams.selectedIndex);
    return Number.isFinite(saved) && saved >= 0 ? saved : 0;
  });
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
  const [statusMessage, setStatusMessage] = useState(initialStatusMessage);

  const prevFamilyNameRef = useRef<string | undefined>(controller?.familyName);

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const prev = prevFamilyNameRef.current;
    const current = controller?.familyName;
    if (prev !== current) {
      if (!current) {
        setStatusMessage("Family removed");
      } else {
        setStatusMessage(`Family set to ${current}`);
      }
      prevFamilyNameRef.current = current;
    }
  });

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
      handleTopBarKey(event);
      return;
    }
    handleListKey(event);
  }

  function handleTopBarKey(event: KeyboardEvent) {
    if (event.key === "Enter") {
      pop();
    }
  }

  function handleListKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setSelectedIndex((prev) => wrapIndex(prev, 1, ITEMS.length));
    } else if (event.key === "ArrowUp") {
      setSelectedIndex((prev) => wrapIndex(prev, -1, ITEMS.length));
    } else if (event.key === "Enter" && isConnected) {
      activateItem(ITEMS[selectedIndex]);
    }
  }

  function activateItem(item: ControllerDetailItem) {
    if (item === "family") {
      pushFrom(
        { selectedIndex: String(selectedIndex) },
        "controller-family-selection",
        { controllerId },
      );
    } else if (item === "controls") {
      pushFrom({ selectedIndex: String(selectedIndex) }, "control-list", {
        ownerId: controllerId,
      });
    } else if (item === "environment-variables") {
      pushFrom(
        { selectedIndex: String(selectedIndex) },
        "environment-variable-list",
        { ownerId: controllerId },
      );
    }
  }

  function toggleFocusRegion(_reverse = false) {
    if (focusRegion === "list") {
      setFocusRegion("topbar");
      backButtonRef.current?.focus();
    } else {
      setFocusRegion("list");
      containerRef.current?.focus();
    }
  }

  const title = `Controllers > ${deviceName}`;

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title controller-detail__title">
          {title}
        </span>
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
          {ITEMS.map((item, index) => (
            <li
              key={item}
              className={[
                "list__row",
                index === selectedIndex && focusRegion === "list"
                  ? "list__row--selected"
                  : "",
                !isConnected ? "list__row--disabled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {labelFor(item)}
            </li>
          ))}
        </ul>
      </div>
      <div className="screen__bottombar">
        {!isConnected ? `Connect ${deviceName} to reconfigure.` : statusMessage}
      </div>
    </div>
  );
}
