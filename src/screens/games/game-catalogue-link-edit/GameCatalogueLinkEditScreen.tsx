import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField = "id" | "save" | "cancel";

const FORM_FIELDS: FormField[] = ["id", "save", "cancel"];

function deriveTitle(
  gameTitle: string,
  catalogueName: string,
  importMode: boolean,
  importTitle: string | null,
): string {
  if (importMode) {
    return `Import Games > ${importTitle ?? gameTitle} > Catalogues > ${catalogueName}`;
  }
  return `${gameTitle} > Catalogues > ${catalogueName}`;
}

function validate(entryId: string): string | null {
  if (!entryId.trim()) return "ID is required.";
  return null;
}

interface GameCatalogueLinkEditScreenProps {
  gameId: string;
  catalogueName: string;
  importMode?: boolean;
  importTitle?: string;
}

export function GameCatalogueLinkEditScreen({
  gameId,
  catalogueName,
  importMode = false,
  importTitle,
}: GameCatalogueLinkEditScreenProps) {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const existingLink = game?.sources.find(
    (s) => s.catalogueName === catalogueName,
  );

  const [draftId, setDraftId] = useState(existingLink?.entryId ?? "");
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [activeField, setActiveField] = useState<FormField>("id");
  const [errorMessage, setErrorMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    idInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeField === "id" && focusRegion === "form") {
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
      idInputRef.current?.blur();
      handleFormKey(event);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      idInputRef.current?.blur();
      pop();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      idInputRef.current?.blur();
      handleSave();
    }
  }

  function handleFormKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      if (focusRegion === "topbar") {
        setFocusRegion("form");
        focusField("id");
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
    if (field === "id") {
      idInputRef.current?.focus();
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
    if (activeField === "id") {
      idInputRef.current?.focus();
    } else if (activeField === "save") {
      handleSave();
    } else if (activeField === "cancel") {
      pop();
    }
  }

  function handleSave() {
    const error = validate(draftId);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage("");
    setStore((prev) => ({
      ...prev,
      gameDetails: {
        ...prev.gameDetails,
        games: prev.gameDetails.games.map((g) =>
          g.id === gameId
            ? {
                ...g,
                sources: g.sources.map((s) =>
                  s.catalogueName === catalogueName
                    ? { ...s, entryId: draftId.trim() }
                    : s,
                ),
              }
            : g,
        ),
      },
    }));
    pop();
  }

  const screenTitle = deriveTitle(
    game?.title ?? "Game",
    catalogueName,
    importMode,
    importTitle ?? null,
  );

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
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
            <label className="form__label" htmlFor="catalogue-id">
              ID
            </label>
            <input
              className={`form__input${activeField === "id" && focusRegion === "form" ? " form__input--active" : ""}`}
              id="catalogue-id"
              ref={idInputRef}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              onFocus={() => {
                setActiveField("id");
                setFocusRegion("form");
              }}
              onBlur={() => setActiveField("id")}
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
              Save
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
      <div className="screen__bottombar">{errorMessage}</div>
    </div>
  );
}
