import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { BinaryStatus, BinaryStatusReason } from "../binary-list/types";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField = "path" | "save" | "cancel";

const FORM_FIELDS: FormField[] = ["path", "save", "cancel"];

function validatePath(path: string): BinaryStatusReason | null {
  if (!path) return null;
  // POC simulation: paths starting with /Applications/VICE/bin/ are valid executables
  if (!path.startsWith("/")) return "Binary not found";
  if (!path.includes("VICE")) return "Binary is not executable";
  return null;
}

function deriveStatus(
  path: string,
  reason: BinaryStatusReason | null,
): BinaryStatus {
  if (!path) return "unconfigured";
  if (reason) return "invalid";
  return "valid";
}

function deriveBottomBarMessage(errorMessage: string): string {
  if (!errorMessage) return "";
  return `${errorMessage}. Games on this platform will be unlaunchable.`;
}

export function BinaryEditScreen() {
  const { pop, currentParams } = useRouter();
  const { store, setStore } = useStore();

  const machineName = currentParams.machineName ?? "";
  const binary = store.binaries.find((b) => b.machineName === machineName);

  const [draftPath, setDraftPath] = useState(binary?.path ?? "");
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [activeField, setActiveField] = useState<FormField>("path");
  const [errorMessage, setErrorMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const pathInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    pathInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
      blurPathInput();
      handleFormKey(event);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      blurPathInput();
      pop();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      blurPathInput();
      handleSave();
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
      if (nextIndex >= FORM_FIELDS.length) {
        setFocusRegion("topbar");
        backButtonRef.current?.focus();
      } else if (nextIndex < 0) {
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
      pathInputRef.current?.focus();
    } else if (field === "save") {
      saveButtonRef.current?.focus();
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
    if (activeField === "path") {
      pathInputRef.current?.focus();
    } else if (activeField === "save") {
      handleSave();
    } else if (activeField === "cancel") {
      pop();
    }
  }

  function blurPathInput() {
    pathInputRef.current?.blur();
  }

  function handleSave() {
    const trimmedPath = draftPath.trim();
    const reason = validatePath(trimmedPath);
    if (trimmedPath && reason) {
      setErrorMessage(reason);
      return;
    }
    setErrorMessage("");
    const status = deriveStatus(trimmedPath, reason);
    setStore((prev) => ({
      ...prev,
      binaries: prev.binaries.map((b) =>
        b.machineName === machineName
          ? {
              ...b,
              path: trimmedPath || null,
              status,
              statusReason: reason,
            }
          : b,
      ),
    }));
    pop();
  }

  const bottomBarMessage = deriveBottomBarMessage(errorMessage);

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{`Binaries > ${machineName}`}</span>
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
        <div className="form">
          <div className="form__field">
            <label className="form__label" htmlFor="binary-path">
              Path
            </label>
            <input
              className={`form__input${activeField === "path" && focusRegion === "form" ? " form__input--active" : ""}`}
              id="binary-path"
              ref={pathInputRef}
              type="text"
              value={draftPath}
              onChange={(e) => setDraftPath(e.target.value)}
              onFocus={() => {
                setActiveField("path");
                setFocusRegion("form");
              }}
              onBlur={() => setActiveField("path")}
            />
          </div>
          <div className="form__actions">
            <button
              ref={saveButtonRef}
              className={`form__action${activeField === "save" && focusRegion === "form" ? " form__action--active" : ""}`}
              onClick={handleSave}
              onFocus={() => {
                setActiveField("save");
                setFocusRegion("form");
              }}
              type="button"
            >
              [Save]
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
              [Cancel]
            </button>
          </div>
        </div>
      </div>
      <div className="screen__bottombar">{bottomBarMessage}</div>
    </div>
  );
}
