import { useEffect, useRef, useState } from "react";
import { BrowseButton } from "../../../components/BrowseButton";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { MediaCandidate } from "../game-media-edit/types";
import type { MediaFlow } from "./media";
import { deriveScreenTitle } from "./media";
import "./index.css";

export type { MediaFlow };

function mediaStoreKey(gameId: string, flow: MediaFlow): string {
  if (flow === "cover-art") return `${gameId}-cover-thumbnail`;
  return `${gameId}-screenshots`;
}

type FocusRegion = "form" | "form-browse" | "form-actions";
type FormActionCta = "select" | "cancel";

const FORM_ACTION_CTAS: FormActionCta[] = ["select", "cancel"];

interface GetFromFileScreenProps {
  gameId: string;
  flow: MediaFlow;
  importMode: boolean;
  importTitle?: string;
}

export function GetFromFileScreen({
  gameId,
  flow,
  importMode,
  importTitle,
}: GetFromFileScreenProps) {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);

  const [filePath, setFilePath] = useState("");
  const [bottomMessage, setBottomMessage] = useState("");

  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [activeField, setActiveField] = useState<"file">("file");
  const [focusedFormCta, setFocusedFormCta] = useState<FormActionCta>("select");

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const browseBtnRef = useRef<HTMLButtonElement>(null);
  const selectButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fileInputRef.current?.focus();
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
      fileInputRef.current?.blur();
      pop();
      return;
    }
    if (focusRegion === "form-actions") {
      handleFormActionsKey(event);
      return;
    }
    if (focusRegion === "form-browse") {
      if (event.key === "Enter") {
        event.preventDefault();
        handleBrowseSelect("/home/user/images/cover.png");
      }
      return;
    }
    // focusRegion === "form"
    if (event.key === "Enter") {
      event.preventDefault();
      fileInputRef.current?.blur();
      handleSelect();
      return;
    }
  }

  function handleFormActionsKey(event: KeyboardEvent) {
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const idx = FORM_ACTION_CTAS.indexOf(focusedFormCta);
      if (idx > 0)
        focusFormActionCta(FORM_ACTION_CTAS[idx - 1] as FormActionCta);
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const idx = FORM_ACTION_CTAS.indexOf(focusedFormCta);
      if (idx < FORM_ACTION_CTAS.length - 1)
        focusFormActionCta(FORM_ACTION_CTAS[idx + 1] as FormActionCta);
    } else if (event.key === "Enter") {
      if (focusedFormCta === "select") handleSelect();
      else pop();
    }
  }

  function focusFormActionCta(cta: FormActionCta) {
    setFocusedFormCta(cta);
    setFocusRegion("form-actions");
    if (cta === "select") selectButtonRef.current?.focus();
    else cancelButtonRef.current?.focus();
  }

  function handleBrowseSelect(selected: string) {
    setFilePath(selected);
    setBottomMessage("");
  }

  function handleSelect() {
    const trimmed = filePath.trim();
    if (!trimmed) {
      setBottomMessage("File is required.");
      return;
    }
    // Simulate loading: add a placeholder candidate
    const key = mediaStoreKey(gameId, flow);
    const candidate: MediaCandidate = {
      id: crypto.randomUUID(),
      url: `https://placehold.co/270x360/1a1a2e/4040ff?text=${encodeURIComponent(trimmed.split(/[/\\]/).pop() ?? trimmed)}`,
    };
    setStore((prev) => ({
      ...prev,
      gameMediaEdit: {
        ...prev.gameMediaEdit,
        candidates: {
          ...prev.gameMediaEdit.candidates,
          [key]: [...(prev.gameMediaEdit.candidates[key] ?? []), candidate],
        },
      },
    }));
    pop();
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "form") {
      if (!reverse) {
        setFocusRegion("form-browse");
        browseBtnRef.current?.focus();
      } else {
        focusFormActionCta(
          FORM_ACTION_CTAS[FORM_ACTION_CTAS.length - 1] as FormActionCta,
        );
      }
    } else if (focusRegion === "form-browse") {
      if (!reverse) {
        focusFormActionCta(FORM_ACTION_CTAS[0] as FormActionCta);
      } else {
        setFocusRegion("form");
        fileInputRef.current?.focus();
      }
    } else {
      // form-actions
      const currentIndex = FORM_ACTION_CTAS.indexOf(focusedFormCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < FORM_ACTION_CTAS.length) {
        focusFormActionCta(FORM_ACTION_CTAS[nextIndex] as FormActionCta);
      } else if (!reverse) {
        setFocusRegion("form");
        fileInputRef.current?.focus();
      } else {
        setFocusRegion("form-browse");
        browseBtnRef.current?.focus();
      }
    }
  }

  const screenTitle = deriveScreenTitle(
    flow,
    importMode,
    game?.title ?? "Game",
    importTitle,
  );

  const isFormActive = focusRegion === "form";
  const isFormActionsActive = focusRegion === "form-actions";

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
      </div>
      <div className="screen__content">
        <div className="form form--two-column-label-left">
          <div className="form__field">
            <label className="form__label" htmlFor="gff-file">
              File
            </label>
            <div className="get-from-file__file-row">
              <input
                id="gff-file"
                ref={fileInputRef}
                className={`form__input get-from-file__file-input${isFormActive && activeField === "file" ? " form__input--active" : ""}`}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={filePath}
                onChange={(e) => {
                  setFilePath(e.target.value);
                  setBottomMessage("");
                }}
                onFocus={() => {
                  setActiveField("file");
                  setFocusRegion("form");
                }}
              />
              <BrowseButton
                active={focusRegion === "form-browse"}
                examplePath="/home/user/images/cover.png"
                onSelect={handleBrowseSelect}
                onFocus={() => setFocusRegion("form-browse")}
                buttonRef={browseBtnRef}
              />
            </div>
          </div>
          <div className="form__actions">
            <button
              ref={selectButtonRef}
              type="button"
              className={`form__action${isFormActionsActive && focusedFormCta === "select" ? " form__action--active" : ""}`}
              onClick={handleSelect}
              onFocus={() => {
                setFocusedFormCta("select");
                setFocusRegion("form-actions");
              }}
            >
              Select
            </button>
            <button
              ref={cancelButtonRef}
              type="button"
              className={`form__action${isFormActionsActive && focusedFormCta === "cancel" ? " form__action--active" : ""}`}
              onClick={pop}
              onFocus={() => {
                setFocusedFormCta("cancel");
                setFocusRegion("form-actions");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      <div className="screen__bottombar">{bottomMessage}</div>
    </div>
  );
}
