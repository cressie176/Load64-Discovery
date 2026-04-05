import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField = "catalogue" | "id" | "save" | "cancel";

const FORM_FIELDS: FormField[] = ["catalogue", "id", "save", "cancel"];
const SUPPORTED_CATALOGUES = ["GameBase64", "MobyGames"];

function deriveAvailableCatalogues(linkedCatalogues: string[]): string[] {
  return SUPPORTED_CATALOGUES.filter((c) => !linkedCatalogues.includes(c)).sort(
    (a, b) => a.localeCompare(b),
  );
}

function deriveTitle(
  gameTitle: string,
  importMode: boolean,
  importTitle: string | null,
): string {
  if (importMode) {
    return `Import Games > ${importTitle ?? gameTitle} > Sources > Add`;
  }
  return `${gameTitle} > Sources > Add`;
}

function validate(catalogue: string, entryId: string): string | null {
  if (!catalogue) return "Catalogue is required.";
  if (!entryId.trim()) return "ID is required.";
  return null;
}

interface GameCatalogueSourceAddScreenProps {
  gameId: string;
  importMode?: boolean;
  importTitle?: string;
}

export function GameCatalogueSourceAddScreen({
  gameId,
  importMode = false,
  importTitle,
}: GameCatalogueSourceAddScreenProps) {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const linkedCatalogues = game?.sources.map((s) => s.catalogueName) ?? [];
  const availableCatalogues = deriveAvailableCatalogues(linkedCatalogues);

  const [draftCatalogue, setDraftCatalogue] = useState(
    availableCatalogues[0] ?? "",
  );
  const [draftId, setDraftId] = useState("");
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [activeField, setActiveField] = useState<FormField>("catalogue");
  const [errorMessage, setErrorMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const catalogueSelectRef = useRef<HTMLSelectElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    catalogueSelectRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (activeField === "catalogue" || activeField === "id") &&
        focusRegion === "form"
      ) {
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
      blurActiveInput();
      handleFormKey(event);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      blurActiveInput();
      pop();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      blurActiveInput();
      if (activeField === "catalogue") {
        focusField("id");
      } else {
        handleSave();
      }
    }
  }

  function handleFormKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      if (focusRegion === "topbar") {
        setFocusRegion("form");
        focusField("catalogue");
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
    if (field === "catalogue") {
      catalogueSelectRef.current?.focus();
    } else if (field === "id") {
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
    if (activeField === "catalogue") {
      catalogueSelectRef.current?.focus();
    } else if (activeField === "id") {
      idInputRef.current?.focus();
    } else if (activeField === "save") {
      handleSave();
    } else if (activeField === "cancel") {
      pop();
    }
  }

  function blurActiveInput() {
    if (activeField === "catalogue") {
      catalogueSelectRef.current?.blur();
    } else if (activeField === "id") {
      idInputRef.current?.blur();
    }
  }

  function handleSave() {
    const error = validate(draftCatalogue, draftId);
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
                sources: [
                  ...g.sources,
                  { catalogueName: draftCatalogue, entryId: draftId.trim() },
                ],
              }
            : g,
        ),
      },
    }));
    pop();
  }

  const screenTitle = deriveTitle(
    game?.title ?? "Game",
    importMode,
    importTitle ?? null,
  );

  const topBarCtas: Array<"back"> = ["back"];

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
        <div className="screen__topbar-ctas">
          <button
            ref={backButtonRef}
            className={`topbar-cta${focusRegion === "topbar" && topBarCtas.includes("back") ? " topbar-cta--focused" : ""}`}
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
            <label className="form__label" htmlFor="catalogue-select">
              Catalogue
            </label>
            <select
              className={`form__input${activeField === "catalogue" && focusRegion === "form" ? " form__input--active" : ""}`}
              id="catalogue-select"
              ref={catalogueSelectRef}
              value={draftCatalogue}
              onChange={(e) => setDraftCatalogue(e.target.value)}
              onFocus={() => {
                setActiveField("catalogue");
                setFocusRegion("form");
              }}
              onBlur={() => setActiveField("catalogue")}
            >
              {availableCatalogues.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="form__field">
            <label className="form__label" htmlFor="catalogue-id">
              ID
            </label>
            <input
              className={`form__input${activeField === "id" && focusRegion === "form" ? " form__input--active" : ""}`}
              id="catalogue-id"
              ref={idInputRef}
              type="text"
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
      <div className="screen__bottombar">{errorMessage}</div>
    </div>
  );
}
