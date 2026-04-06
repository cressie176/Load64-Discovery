import { useEffect, useRef, useState } from "react";
import { BrowseButton } from "../../../components/BrowseButton";
import { useRouter } from "../../../router/RouterContext";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField = "path" | "browse" | "discover";

const FORM_FIELDS: FormField[] = ["path", "browse", "discover"];

function validatePath(path: string): string | null {
  if (!path.trim()) return "Path is required.";
  return null;
}

function simulateDiscovery(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1500));
}

export function ImportGamesScreen() {
  const { pop, push } = useRouter();

  const [path, setPath] = useState("");
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [activeField, setActiveField] = useState<FormField>("path");
  const [discovering, setDiscovering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const pathRef = useRef<HTMLInputElement>(null);
  const browseButtonRef = useRef<HTMLButtonElement>(null);
  const discoverButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (discovering) return;
      if (activeField === "path" && focusRegion === "form") {
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
        focusField("path");
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
    if (field === "path") {
      pathRef.current?.focus();
    } else if (field === "browse") {
      browseButtonRef.current?.focus();
    } else if (field === "discover") {
      discoverButtonRef.current?.focus();
    }
  }

  function moveField(delta: number) {
    const currentIndex = FORM_FIELDS.indexOf(activeField);
    const nextIndex =
      (currentIndex + delta + FORM_FIELDS.length) % FORM_FIELDS.length;
    focusField(FORM_FIELDS[nextIndex] as FormField);
  }

  function activateField() {
    if (activeField === "path") {
      pathRef.current?.focus();
    } else if (activeField === "browse") {
      handleBrowse("/Users/steve/Games/C64");
    } else if (activeField === "discover") {
      handleDiscover();
    }
  }

  function handleBrowse(selected: string) {
    setPath(selected);
    pathRef.current?.focus();
  }

  function blurActiveInput() {
    pathRef.current?.blur();
    setActiveField("path");
  }

  function handleDiscover() {
    const validationError = validatePath(path);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage("");
    setDiscovering(true);
    simulateDiscovery().then(() => {
      setDiscovering(false);
      push("import-discovery", { importPath: path.trim() });
    });
  }

  const bottomBarMessage = discovering ? "Discovering…" : errorMessage;

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">Import Games</span>
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
        <div className="form form--two-column-label-left">
          <div className="form__field">
            <label className="form__label" htmlFor="import-path">
              Path *
            </label>
            <div className="import-games__input-row">
              <input
                className={`form__input${activeField === "path" && focusRegion === "form" ? " form__input--active" : ""}`}
                disabled={discovering}
                id="import-path"
                onChange={(e) => setPath(e.target.value)}
                onFocus={() => {
                  setActiveField("path");
                  setFocusRegion("form");
                }}
                ref={pathRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                value={path}
              />
              <BrowseButton
                active={activeField === "browse" && focusRegion === "form"}
                buttonRef={browseButtonRef}
                examplePath="/Users/steve/Games/C64"
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
              className={`form__action${activeField === "discover" && focusRegion === "form" ? " form__action--active" : ""}`}
              disabled={discovering}
              onClick={handleDiscover}
              onFocus={() => {
                setActiveField("discover");
                setFocusRegion("form");
              }}
              ref={discoverButtonRef}
              type="button"
            >
              [Discover]
            </button>
          </div>
        </div>
      </div>
      <div className="screen__bottombar">{bottomBarMessage}</div>
    </div>
  );
}
