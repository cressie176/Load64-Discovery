import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { MediaCandidate } from "../game-media-edit/types";
import type { CatalogueFlow } from "./catalogue";
import { deriveScreenTitle, simulateFetch } from "./catalogue";
import "./index.css";

export type { FetchedGameDetails } from "./catalogue";
export type { CatalogueFlow };

const SUPPORTED_CATALOGUES = ["GameBase64", "MobyGames"];

function deriveKnownId(
  sources: Array<{ catalogueName: string; entryId: string }>,
  catalogueName: string,
): string {
  return sources.find((s) => s.catalogueName === catalogueName)?.entryId ?? "";
}

function mediaStoreKey(gameId: string, flow: CatalogueFlow): string {
  if (flow === "cover-art") return `${gameId}-cover-thumbnail`;
  return `${gameId}-screenshots`;
}

type FocusRegion = "form" | "form-actions";
type FormField = "catalogue" | "id";
type FormActionCta = "fetch" | "cancel";

const FORM_ACTION_CTAS: FormActionCta[] = ["fetch", "cancel"];

interface GetFromCatalogueScreenProps {
  gameId: string;
  flow: CatalogueFlow;
  importMode: boolean;
  importTitle?: string;
}

export function GetFromCatalogueScreen({
  gameId,
  flow,
  importMode,
  importTitle,
}: GetFromCatalogueScreenProps) {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const sources = game?.sources ?? [];

  const [selectedCatalogue, setSelectedCatalogue] = useState(
    SUPPORTED_CATALOGUES[0] ?? "",
  );
  const [entryId, setEntryId] = useState(() =>
    deriveKnownId(sources, SUPPORTED_CATALOGUES[0] ?? ""),
  );
  const [fetching, setFetching] = useState(false);
  const [bottomMessage, setBottomMessage] = useState("");

  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [activeField, setActiveField] = useState<FormField>("catalogue");
  const [focusedFormCta, setFocusedFormCta] = useState<FormActionCta>("fetch");

  const containerRef = useRef<HTMLDivElement>(null);
  const catalogueSelectRef = useRef<HTMLSelectElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const fetchButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    catalogueSelectRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (fetching) return;
      handleMainKey(event);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleMainKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      // Blur the ID input if it has focus — it is skipped by Tab
      if (focusRegion === "form" && activeField === "id") {
        idInputRef.current?.blur();
      }
      toggleFocusRegion(event.shiftKey);
      return;
    }
    if (event.key === "Escape") {
      blurActiveInput();
      pop();
      return;
    }
    if (focusRegion === "form-actions") {
      handleFormActionsKey(event);
      return;
    }
    handleFormKey(event);
  }

  function handleFormKey(event: KeyboardEvent) {
    const isInput = activeField === "catalogue" || activeField === "id";
    if (isInput) {
      if (event.key === "Enter") {
        event.preventDefault();
        blurActiveInput();
        if (activeField === "catalogue") {
          focusFormField("id");
        } else {
          handleFetch();
        }
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveFormField(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveFormField(-1);
        return;
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFormField(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFormField(-1);
    } else if (event.key === "Enter") {
      activateFormField();
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
      if (focusedFormCta === "fetch") handleFetch();
      else pop();
    }
  }

  function moveFormField(delta: number) {
    const fields: FormField[] = ["catalogue", "id"];
    const idx = fields.indexOf(activeField);
    const next = idx + delta;
    if (next >= 0 && next < fields.length) {
      focusFormField(fields[next] as FormField);
    }
  }

  function activateFormField() {
    if (activeField === "catalogue") {
      catalogueSelectRef.current?.focus();
    } else if (activeField === "id") {
      idInputRef.current?.focus();
    }
  }

  function focusFormField(field: FormField) {
    setActiveField(field);
    setFocusRegion("form");
    if (field === "catalogue") {
      catalogueSelectRef.current?.focus();
    } else if (field === "id") {
      idInputRef.current?.focus();
    }
  }

  function focusFormActionCta(cta: FormActionCta) {
    setFocusedFormCta(cta);
    setFocusRegion("form-actions");
    if (cta === "fetch") fetchButtonRef.current?.focus();
    else cancelButtonRef.current?.focus();
  }

  function blurActiveInput() {
    if (activeField === "catalogue") catalogueSelectRef.current?.blur();
    else if (activeField === "id") idInputRef.current?.blur();
  }

  function handleCatalogueChange(name: string) {
    setSelectedCatalogue(name);
    setEntryId(deriveKnownId(sources, name));
    setBottomMessage("");
  }

  function handleFetch() {
    const trimmedId = entryId.trim();
    if (!trimmedId) {
      setBottomMessage("ID is required.");
      return;
    }
    setFetching(true);
    setBottomMessage(`Fetching from ${selectedCatalogue}…`);

    if (flow === "details") {
      simulateFetch(gameId, selectedCatalogue, trimmedId)
        .then((fetched) => {
          setStore((prev) => ({
            ...prev,
            getCatalogueResult: {
              catalogueName: selectedCatalogue,
              entryId: trimmedId,
              fetched,
            },
          }));
          saveEntryId(trimmedId);
          setFetching(false);
          pop();
        })
        .catch(() => {
          setBottomMessage(
            `Could not fetch from ${selectedCatalogue}. Check the ID and try again.`,
          );
          setFetching(false);
        });
    } else {
      // Simulate image fetch for media flows
      setTimeout(() => {
        const candidate: MediaCandidate = {
          id: crypto.randomUUID(),
          url: `https://placehold.co/270x360/1a1a2e/4040ff?text=${encodeURIComponent(selectedCatalogue)}`,
        };
        const key = mediaStoreKey(gameId, flow);
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
        saveEntryId(trimmedId);
        setFetching(false);
        pop();
      }, 800);
    }
  }

  function saveEntryId(id: string) {
    setStore((prev) => ({
      ...prev,
      gameDetails: {
        ...prev.gameDetails,
        games: prev.gameDetails.games.map((g) => {
          if (g.id !== gameId) return g;
          const existing = g.sources.find(
            (s) => s.catalogueName === selectedCatalogue,
          );
          if (existing) {
            return {
              ...g,
              sources: g.sources.map((s) =>
                s.catalogueName === selectedCatalogue
                  ? { ...s, entryId: id }
                  : s,
              ),
            };
          }
          return {
            ...g,
            sources: [
              ...g.sources,
              { catalogueName: selectedCatalogue, entryId: id },
            ],
          };
        }),
      },
    }));
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "form") {
      // Tab forward: go to first form-action (Fetch)
      // Shift+Tab backward: go to last form-action (Cancel)
      if (!reverse) {
        focusFormActionCta(FORM_ACTION_CTAS[0] as FormActionCta);
      } else {
        focusFormActionCta(
          FORM_ACTION_CTAS[FORM_ACTION_CTAS.length - 1] as FormActionCta,
        );
      }
    } else {
      const currentIndex = FORM_ACTION_CTAS.indexOf(focusedFormCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < FORM_ACTION_CTAS.length) {
        focusFormActionCta(FORM_ACTION_CTAS[nextIndex] as FormActionCta);
      } else {
        // Wrap back to the catalogue dropdown — ID is skipped by Tab
        setFocusRegion("form");
        setActiveField("catalogue");
        catalogueSelectRef.current?.focus();
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
        <div
          className={`form form--two-column-label-left${fetching ? " form--disabled" : ""}`}
        >
          <div className="form__field">
            <label className="form__label" htmlFor="gfc-catalogue">
              Catalogue
            </label>
            <select
              id="gfc-catalogue"
              ref={catalogueSelectRef}
              className={`form__input${isFormActive && activeField === "catalogue" ? " form__input--active" : ""}`}
              value={selectedCatalogue}
              disabled={fetching}
              onChange={(e) => handleCatalogueChange(e.target.value)}
              onFocus={() => {
                setActiveField("catalogue");
                setFocusRegion("form");
              }}
            >
              {SUPPORTED_CATALOGUES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="form__field">
            <label className="form__label" htmlFor="gfc-id">
              ID
            </label>
            <input
              id="gfc-id"
              ref={idInputRef}
              className={`form__input${isFormActive && activeField === "id" ? " form__input--active" : ""}`}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={entryId}
              disabled={fetching}
              onChange={(e) => {
                setEntryId(e.target.value);
                setBottomMessage("");
              }}
              onFocus={() => {
                setActiveField("id");
                setFocusRegion("form");
              }}
            />
          </div>
          <div className="form__actions">
            <button
              ref={fetchButtonRef}
              type="button"
              className={`form__action${isFormActionsActive && focusedFormCta === "fetch" ? " form__action--active" : ""}`}
              disabled={fetching}
              onClick={handleFetch}
              onFocus={() => {
                setFocusedFormCta("fetch");
                setFocusRegion("form-actions");
              }}
            >
              Fetch
            </button>
            <button
              ref={cancelButtonRef}
              type="button"
              className={`form__action${isFormActionsActive && focusedFormCta === "cancel" ? " form__action--active" : ""}`}
              disabled={fetching}
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
