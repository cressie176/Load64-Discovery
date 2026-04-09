import { useEffect, useRef, useState } from "react";
import { BrowseButton } from "../../../components/BrowseButton";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField = "vicePath" | "browse" | "discover" | "cancel";

const FORM_FIELDS: FormField[] = ["vicePath", "browse", "discover", "cancel"];

const MACHINE_BINARIES: Record<string, string> = {
  "Commodore 64": "x64sc",
  "C64 DTV": "x64dtv",
  "Commodore 128": "x128",
  "VIC-20": "xvic",
  "Commodore Plus/4": "xplus4",
  "Commodore PET": "xpet",
  "CBM-II": "xcbm2",
  "CBM 5x0": "xcbm5x0",
  "SuperCPU 64": "xscpu64",
};

function resolveViceBinPath(vicePath: string, binaryName: string): string {
  const trimmed = vicePath.replace(/\/+$/, "");
  if (trimmed.endsWith("/bin")) {
    return `${trimmed}/${binaryName}`;
  }
  return `${trimmed}/bin/${binaryName}`;
}

function discoverBinaries(
  vicePath: string,
  machineNames: string[],
): Map<string, string> {
  const discovered = new Map<string, string>();
  for (const machineName of machineNames) {
    const binaryName = MACHINE_BINARIES[machineName];
    if (binaryName) {
      discovered.set(machineName, resolveViceBinPath(vicePath, binaryName));
    }
  }
  return discovered;
}

export function BinaryDiscoverScreen() {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const [vicePath, setVicePath] = useState("/Applications/VICE");
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [activeField, setActiveField] = useState<FormField>("vicePath");
  const [errorMessage, setErrorMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);
  const vicePathRef = useRef<HTMLInputElement>(null);
  const browseButtonRef = useRef<HTMLButtonElement>(null);
  const discoverButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeField === "vicePath" && focusRegion === "form") {
        handleTextInputKey(event);
        return;
      }
      handleFormKey(event);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleTextInputKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      blurActiveInput();
      handleFormKey(event);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      blurActiveInput();
      pop();
    }
  }

  function handleFormKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      if (focusRegion === "topbar") {
        setFocusRegion("form");
        focusField("vicePath");
        return;
      }
      const delta = event.shiftKey ? -1 : 1;
      const currentIndex = FORM_FIELDS.indexOf(activeField);
      const nextIndex = currentIndex + delta;
      if (nextIndex >= FORM_FIELDS.length || nextIndex < 0) {
        setFocusRegion("topbar");
        backButtonRef.current?.focus();
      } else {
        focusField(FORM_FIELDS[nextIndex] as FormField);
      }
      return;
    }
    if (event.key === "Escape") {
      pop();
      return;
    }
    if (focusRegion === "topbar") {
      if (event.key === "Enter") pop();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveField(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveField(-1);
    } else if (event.key === "Enter") {
      activateField();
    }
  }

  function focusField(field: FormField) {
    setActiveField(field);
    setFocusRegion("form");
    if (field === "vicePath") {
      vicePathRef.current?.focus();
    } else if (field === "browse") {
      browseButtonRef.current?.focus();
    } else if (field === "discover") {
      discoverButtonRef.current?.focus();
    } else if (field === "cancel") {
      cancelButtonRef.current?.focus();
    }
  }

  function moveField(delta: number) {
    const currentIndex = FORM_FIELDS.indexOf(activeField);
    const nextIndex =
      (currentIndex + delta + FORM_FIELDS.length) % FORM_FIELDS.length;
    focusField(FORM_FIELDS[nextIndex] as FormField);
  }

  function activateField() {
    if (activeField === "vicePath") {
      vicePathRef.current?.focus();
    } else if (activeField === "browse") {
      handleBrowse("/Applications/VICE");
    } else if (activeField === "discover") {
      handleDiscover();
    } else if (activeField === "cancel") {
      pop();
    }
  }

  function blurActiveInput() {
    vicePathRef.current?.blur();
    setActiveField("vicePath");
  }

  function handleBrowse(selected: string) {
    setVicePath(selected);
    vicePathRef.current?.focus();
  }

  function handleDiscover() {
    const trimmed = vicePath.trim();
    if (!trimmed) {
      setErrorMessage("VICE Path is required.");
      return;
    }
    setErrorMessage("");
    const machineNames = store.binaries.map((b) => b.machineName);
    const discovered = discoverBinaries(trimmed, machineNames);
    const count = discovered.size;
    setStore((prev) => ({
      ...prev,
      binaries: prev.binaries.map((binary) => {
        const discoveredPath = discovered.get(binary.machineName);
        if (!discoveredPath) return binary;
        return {
          ...binary,
          path: discoveredPath,
          status: "valid",
          statusReason: null,
        };
      }),
      discoveryMessage: `Discovered ${count} binaries.`,
    }));
    pop();
  }

  const bottomBarMessage = errorMessage;

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{"Binaries > Discover"}</span>
        <div className="screen__topbar-ctas">
          <a
            ref={backButtonRef}
            href="#"
            className={`topbar-cta topbar-cta--nav${focusRegion === "topbar" ? " topbar-cta--focused" : ""}`}
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
        <div className="form form--two-column-label-left">
          <div className="form__field">
            <label className="form__label" htmlFor="vice-path">
              VICE Path *
            </label>
            <div className="binary-discover__input-row">
              <input
                className={`form__input${activeField === "vicePath" && focusRegion === "form" ? " form__input--active" : ""}`}
                id="vice-path"
                ref={vicePathRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={vicePath}
                onChange={(e) => setVicePath(e.target.value)}
                onFocus={() => {
                  setActiveField("vicePath");
                  setFocusRegion("form");
                }}
              />
              <BrowseButton
                active={activeField === "browse" && focusRegion === "form"}
                buttonRef={browseButtonRef}
                examplePath="/Applications/VICE"
                onFocus={() => {
                  setActiveField("browse");
                  setFocusRegion("form");
                }}
                onSelect={handleBrowse}
              />
            </div>
          </div>
          <div className="form__actions">
            <button
              ref={discoverButtonRef}
              className={`form__action${activeField === "discover" && focusRegion === "form" ? " form__action--active" : ""}`}
              onClick={handleDiscover}
              onFocus={() => {
                setActiveField("discover");
                setFocusRegion("form");
              }}
              type="button"
            >
              Discover
            </button>
            <button
              ref={cancelButtonRef}
              className={`form__action${activeField === "cancel" && focusRegion === "form" ? " form__action--active" : ""}`}
              onClick={pop}
              onFocus={() => {
                setActiveField("cancel");
                setFocusRegion("form");
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      <div className="screen__bottombar">{bottomBarMessage}</div>
    </div>
  );
}
