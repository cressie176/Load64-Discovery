import { useEffect, useRef, useState } from "react";
import { BrowseButton } from "../../../components/BrowseButton";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import { deriveSlotName } from "../game-media-edit/GameMediaEditScreen";
import type { MediaSlot } from "../game-media-edit/types";
import type { SourceMode } from "./types";
import "./index.css";

export function deriveScreenTitle(
  gameTitle: string,
  slotName: string,
  _mode: SourceMode,
): string {
  return `${gameTitle} > Media > ${slotName} > Add`;
}

export function deriveFieldLabel(mode: SourceMode): string {
  return mode === "file" ? "File *" : "URL *";
}

export function deriveSubmitLabel(mode: SourceMode): string {
  return mode === "file" ? "Select" : "Download";
}

export function validate(value: string): string | null {
  if (!value.trim()) return "This field is required.";
  return null;
}

type FormField = "input" | "browse" | "submit" | "cancel";

function deriveFormFields(mode: SourceMode): FormField[] {
  if (mode === "file") return ["input", "browse", "submit", "cancel"];
  return ["input", "submit", "cancel"];
}

interface GameMediaAddScreenProps {
  gameId: string;
  mediaSlot: string;
  source: string;
}

export function GameMediaAddScreen({
  gameId,
  mediaSlot,
  source,
}: GameMediaAddScreenProps) {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const mode = (source === "url" ? "url" : "file") as SourceMode;
  const slot = mediaSlot as MediaSlot;
  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const slotName = deriveSlotName(slot);
  const screenTitle = deriveScreenTitle(game?.title ?? "Game", slotName, mode);
  const formFields = deriveFormFields(mode);

  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [focusRegion, setFocusRegion] = useState<"form" | "topbar">("form");
  const [activeField, setActiveField] = useState<FormField>("input");

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const browseButtonRef = useRef<HTMLButtonElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeField === "input" && focusRegion === "form") {
        handleInputKey(event);
        return;
      }
      handleFormKey(event);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleInputKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      inputRef.current?.blur();
      handleFormKey(event);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      inputRef.current?.blur();
      pop();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      inputRef.current?.blur();
      moveField(1);
    }
  }

  function handleFormKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      if (focusRegion === "topbar") {
        setFocusRegion("form");
        focusField("input");
        return;
      }
      const delta = event.shiftKey ? -1 : 1;
      const currentIndex = formFields.indexOf(activeField);
      const nextIndex = currentIndex + delta;
      if (nextIndex >= formFields.length || nextIndex < 0) {
        setFocusRegion("topbar");
        backButtonRef.current?.focus();
      } else {
        focusField(formFields[nextIndex] as FormField);
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
    if (field === "input") {
      inputRef.current?.focus();
    } else if (field === "browse") {
      browseButtonRef.current?.focus();
    } else if (field === "submit") {
      submitButtonRef.current?.focus();
    } else if (field === "cancel") {
      cancelButtonRef.current?.focus();
    }
  }

  function moveField(delta: number) {
    const currentIndex = formFields.indexOf(activeField);
    const nextIndex =
      (currentIndex + delta + formFields.length) % formFields.length;
    focusField(formFields[nextIndex] as FormField);
  }

  function activateField() {
    if (activeField === "input") {
      inputRef.current?.focus();
    } else if (activeField === "browse") {
      handleBrowseSelect("/Users/steve/Games/C64/covers/image.jpg");
    } else if (activeField === "submit") {
      handleSubmit();
    } else if (activeField === "cancel") {
      pop();
    }
  }

  function handleBrowseSelect(path: string) {
    setInputValue(path);
    focusField("input");
  }

  function handleSubmit() {
    const error = validate(inputValue);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage("");
    const url =
      mode === "url"
        ? inputValue.trim()
        : `https://placehold.co/270x360/1a1a2e/4040ff?text=${encodeURIComponent(inputValue.trim())}`;
    appendCandidate(url);
    pop();
  }

  function appendCandidate(url: string) {
    const key = `${gameId}-${slot}`;
    const newCandidate = { id: crypto.randomUUID(), url };
    setStore((prev) => ({
      ...prev,
      gameMediaEdit: {
        ...prev.gameMediaEdit,
        candidates: {
          ...prev.gameMediaEdit.candidates,
          [key]: [...(prev.gameMediaEdit.candidates[key] ?? []), newCandidate],
        },
      },
    }));
  }

  const topBarCtas: Array<"back"> = ["back"];

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
        <div className="screen__topbar-ctas">
          <a
            ref={backButtonRef}
            href="#"
            className={`topbar-cta topbar-cta--nav${focusRegion === "topbar" && topBarCtas.includes("back") ? " topbar-cta--focused" : ""}`}
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
            <label className="form__label" htmlFor="media-add-input">
              {deriveFieldLabel(mode)}
            </label>
            {mode === "file" ? (
              <div className="media-add__file-row">
                <input
                  className={`form__input${activeField === "input" && focusRegion === "form" ? " form__input--active" : ""}`}
                  id="media-add-input"
                  ref={inputRef}
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => {
                    setActiveField("input");
                    setFocusRegion("form");
                  }}
                />
                <BrowseButton
                  active={activeField === "browse" && focusRegion === "form"}
                  buttonRef={browseButtonRef}
                  examplePath="/Users/steve/Games/C64/covers/image.jpg"
                  onFocus={() => {
                    setActiveField("browse");
                    setFocusRegion("form");
                  }}
                  onSelect={handleBrowseSelect}
                />
              </div>
            ) : (
              <input
                className={`form__input${activeField === "input" && focusRegion === "form" ? " form__input--active" : ""}`}
                id="media-add-input"
                ref={inputRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => {
                  setActiveField("input");
                  setFocusRegion("form");
                }}
              />
            )}
          </div>
          <div className="form__actions">
            <button
              ref={submitButtonRef}
              type="button"
              className={`form__action${activeField === "submit" && focusRegion === "form" ? " form__action--active" : ""}`}
              onClick={handleSubmit}
              onFocus={() => {
                setActiveField("submit");
                setFocusRegion("form");
              }}
            >
              {deriveSubmitLabel(mode)}
            </button>
            <button
              ref={cancelButtonRef}
              type="button"
              className={`form__action${activeField === "cancel" && focusRegion === "form" ? " form__action--active" : ""}`}
              onClick={pop}
              onFocus={() => {
                setActiveField("cancel");
                setFocusRegion("form");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      <div className="screen__bottombar">{errorMessage}</div>
    </div>
  );
}
