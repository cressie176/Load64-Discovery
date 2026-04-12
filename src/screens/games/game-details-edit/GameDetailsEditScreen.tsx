import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { GameDetails } from "../game-details/types";
import "./index.css";

type FocusRegion = "form" | "topbar";
type TopBarCta = "next" | "back";
type ImportableField = "title" | "publisher" | "year" | "notes";
type FormField =
  | "title"
  | "apply-title"
  | "publisher"
  | "apply-publisher"
  | "year"
  | "apply-year"
  | "colourEncoding"
  | "trueDriveEmulation"
  | "notes"
  | "apply-notes"
  | "get-details"
  | "save"
  | "cancel";

interface FetchedGameDetails {
  title?: string;
  publisher?: string;
  year?: string;
  notes?: string;
}

export function deriveScreenTitle(
  importMode: boolean,
  gameTitle: string,
  fetchSource: string | null,
  importTitle?: string,
): string {
  const label = importTitle ?? gameTitle;
  if (importMode) {
    if (fetchSource) {
      return `Import Games > ${label} > Details > ${fetchSource}`;
    }
    return `Import Games > ${label} > Details`;
  }
  if (fetchSource) {
    return `${label} > Details > ${fetchSource}`;
  }
  return `${label} > Details`;
}

export function simulateFetch(
  _gameId: string,
  catalogueName: string,
  entryId: string,
): Promise<FetchedGameDetails> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (catalogueName === "GameBase64") {
        const results: Record<string, FetchedGameDetails> = {
          "243": {
            title: "Bubble Bobble (Taito, 1987)",
            publisher: "Taito Corporation",
            notes:
              "Classic arcade conversion. Bubble Bobble was developed by Taito and released for the C64 in 1987. Features all 100 levels from the original arcade release.",
          },
          "881": {
            title: "Elite",
            publisher: "Firebird Software",
            year: "1985",
            notes:
              "Space trading and combat game. Originally developed by David Braben and Ian Bell. The C64 version was published by Firebird in 1985.",
          },
          "1654": {
            title: "Iridis Alpha",
            publisher: "Llamasoft",
            notes:
              "A vertically scrolling shoot-em-up by Jeff Minter, published by Hewson Consultants. Features psychedelic visuals and soundtrack.",
          },
          "2301": {
            title: "Monty on the Run",
            publisher: "Gremlin Graphics Software",
            notes:
              "Monty Mole escapes from prison and must reach Europe. Features a Rob Hubbard soundtrack.",
          },
          "2879": {
            title: "Out Run",
            publisher: "U.S. Gold Ltd.",
            year: "1987",
            notes:
              "Driving game based on the Sega arcade original. Published by U.S. Gold.",
          },
          "3847": {
            title: "Turrican II: The Final Fight",
            publisher: "Rainbow Arts Software",
            notes:
              "Platform action game developed by Factor 5. Features music by Chris Hülsbeck. One of the most technically impressive C64 titles.",
          },
        };
        const result = results[entryId];
        if (result) {
          resolve(result);
        } else {
          reject(new Error(`No entry found for ${catalogueName}: ${entryId}`));
        }
      } else if (catalogueName === "MobyGames") {
        const results: Record<string, FetchedGameDetails> = {
          "1188": {
            title: "Bubble Bobble",
            publisher: "Taito",
            year: "1987",
            notes:
              "Bubble Bobble is a platform game where players control dragons Bub and Bob. Trap enemies in bubbles then burst them.",
          },
          "7823": {
            title: "Monty on the Run",
            publisher: "Gremlin Graphics",
            year: "1985",
            notes:
              "Side-scrolling platform game featuring Monty the mole. Escape from prison across multiple screens.",
          },
        };
        const result = results[entryId];
        if (result) {
          resolve(result);
        } else {
          reject(new Error(`No entry found for ${catalogueName}: ${entryId}`));
        }
      } else {
        reject(new Error(`Unknown catalogue: ${catalogueName}`));
      }
    }, 800);
  });
}

interface GameDetailsEditScreenProps {
  gameId: string;
  importMode?: boolean;
  importTitle?: string;
}

export function GameDetailsEditScreen({
  gameId,
  importMode = false,
  importTitle,
}: GameDetailsEditScreenProps) {
  const { pop, push } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);

  const [draftTitle, setDraftTitle] = useState(game?.title ?? "");
  const [draftPublisher, setDraftPublisher] = useState(game?.publisher ?? "");
  const [draftYear, setDraftYear] = useState(
    game?.year !== undefined ? String(game.year) : "",
  );
  const [draftColourEncoding, setDraftColourEncoding] = useState<
    "pal" | "ntsc" | "unknown"
  >(game?.colourEncoding ?? "unknown");
  const [draftTrueDriveEmulation, setDraftTrueDriveEmulation] = useState(
    game?.trueDriveEmulation ?? false,
  );
  const [draftNotes, setDraftNotes] = useState(game?.notes ?? "");

  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [activeField, setActiveField] = useState<FormField>("title");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("back");

  const [fetchSource] = useState<string | null>(null);
  const [importedValues, setImportedValues] = useState<
    Partial<Record<ImportableField, string>>
  >({});
  const [bottomMessage, setBottomMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const applyTitleRef = useRef<HTMLButtonElement>(null);
  const publisherInputRef = useRef<HTMLInputElement>(null);
  const applyPublisherRef = useRef<HTMLButtonElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const applyYearRef = useRef<HTMLButtonElement>(null);
  const colourEncodingSelectRef = useRef<HTMLSelectElement>(null);
  const trueDriveSelectRef = useRef<HTMLSelectElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const applyNotesRef = useRef<HTMLButtonElement>(null);
  const getDetailsButtonRef = useRef<HTMLButtonElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const hasImportedValues = Object.keys(importedValues).length > 0;

  // Build the form field order dynamically based on which imported values are present
  function buildFormFields(): FormField[] {
    const fields: FormField[] = ["title"];
    if (importedValues.title) fields.push("apply-title");
    fields.push("publisher");
    if (importedValues.publisher) fields.push("apply-publisher");
    fields.push("year");
    if (importedValues.year) fields.push("apply-year");
    fields.push("colourEncoding", "trueDriveEmulation", "notes");
    if (importedValues.notes) fields.push("apply-notes");
    if (!importMode) fields.push("save", "cancel");
    fields.push("get-details");
    return fields;
  }

  const topBarCtas: TopBarCta[] = importMode ? ["next", "back"] : ["back"];
  const formActionFields: FormField[] = importMode
    ? ["get-details"]
    : ["save", "cancel", "get-details"];

  useEffect(() => {
    titleInputRef.current?.focus();
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
      const isFormAction =
        focusRegion === "form" && formActionFields.includes(activeField);
      if (isFormAction) {
        advanceFromFormAction(activeField, event.shiftKey);
        return;
      }
      const isTextActive =
        focusRegion === "form" &&
        (activeField === "title" ||
          activeField === "publisher" ||
          activeField === "year" ||
          activeField === "notes");
      if (isTextActive) {
        getInputRef(activeField)?.blur();
      }
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
    handleFormKey(event);
  }

  function handleTopBarKey(event: KeyboardEvent) {
    if (event.key === "Enter") {
      if (focusedCta === "next") {
        handleNext();
      } else {
        pop();
      }
    }
  }

  function handleFormKey(event: KeyboardEvent) {
    const isTextInput =
      activeField === "title" ||
      activeField === "publisher" ||
      activeField === "year";
    const isTextarea = activeField === "notes";

    if (isTextInput) {
      if (event.key === "Enter") {
        event.preventDefault();
        getInputRef(activeField)?.blur();
        handleSaveOrNext();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        getInputRef(activeField)?.blur();
        pop();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveField(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveField(-1);
        return;
      }
      return;
    }

    if (isTextarea) {
      if (event.key === "Escape") {
        event.preventDefault();
        notesTextareaRef.current?.blur();
        pop();
        return;
      }
      if (event.key === "ArrowDown" && !event.shiftKey) {
        const ta = notesTextareaRef.current;
        if (ta && ta.selectionStart === ta.value.length) {
          event.preventDefault();
          moveField(1);
          return;
        }
      }
      if (event.key === "ArrowUp" && !event.shiftKey) {
        const ta = notesTextareaRef.current;
        if (ta && ta.selectionStart === 0) {
          event.preventDefault();
          moveField(-1);
          return;
        }
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveField(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveField(-1);
    } else if (event.key === "Enter") {
      activateCurrentField();
    }
  }

  function getInputRef(
    field: FormField,
  ): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null {
    switch (field) {
      case "title":
        return titleInputRef.current;
      case "publisher":
        return publisherInputRef.current;
      case "year":
        return yearInputRef.current;
      case "colourEncoding":
        return colourEncodingSelectRef.current;
      case "trueDriveEmulation":
        return trueDriveSelectRef.current;
      case "notes":
        return notesTextareaRef.current;
      default:
        return null;
    }
  }

  function focusField(field: FormField) {
    setActiveField(field);
    setFocusRegion("form");
    const el = getInputRef(field);
    if (el) {
      el.focus();
    } else if (field === "apply-title") {
      applyTitleRef.current?.focus();
    } else if (field === "apply-publisher") {
      applyPublisherRef.current?.focus();
    } else if (field === "apply-year") {
      applyYearRef.current?.focus();
    } else if (field === "apply-notes") {
      applyNotesRef.current?.focus();
    } else if (field === "get-details") {
      getDetailsButtonRef.current?.focus();
    } else if (field === "save") {
      saveButtonRef.current?.focus();
    } else if (field === "cancel") {
      cancelButtonRef.current?.focus();
    }
  }

  function moveField(delta: number) {
    const current = buildFormFields();
    const currentIndex = current.indexOf(activeField);
    const nextIndex = (currentIndex + delta + current.length) % current.length;
    focusField(current[nextIndex] as FormField);
  }

  function activateCurrentField() {
    if (activeField === "save") {
      handleSaveOrNext();
    } else if (activeField === "cancel") {
      pop();
    } else if (activeField === "get-details") {
      handleGetDetails();
    } else if (activeField === "apply-title") {
      applyImported("title");
    } else if (activeField === "apply-publisher") {
      applyImported("publisher");
    } else if (activeField === "apply-year") {
      applyImported("year");
    } else if (activeField === "apply-notes") {
      applyImported("notes");
    } else {
      getInputRef(activeField)?.focus();
    }
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "form") {
      if (!reverse) {
        setFocusRegion("form");
        focusField(formActionFields[0] as FormField);
      } else {
        const cta = topBarCtas[topBarCtas.length - 1];
        setFocusRegion("topbar");
        setFocusedCta(cta);
        focusCtaButton(cta);
      }
    } else if (focusRegion === "topbar") {
      const currentIndex = topBarCtas.indexOf(focusedCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < topBarCtas.length) {
        const nextCta = topBarCtas[nextIndex] as TopBarCta;
        setFocusedCta(nextCta);
        focusCtaButton(nextCta);
      } else if (!reverse) {
        setFocusRegion("form");
        focusField("title");
      } else {
        setFocusRegion("form");
        focusField(formActionFields[formActionFields.length - 1] as FormField);
      }
    }
  }

  function advanceFromFormAction(currentCta: FormField, reverse: boolean) {
    const currentIndex = formActionFields.indexOf(currentCta);
    const nextIndex = currentIndex + (reverse ? -1 : 1);
    if (nextIndex >= 0 && nextIndex < formActionFields.length) {
      focusField(formActionFields[nextIndex] as FormField);
    } else if (!reverse) {
      const cta = topBarCtas[0];
      setFocusRegion("topbar");
      setFocusedCta(cta);
      focusCtaButton(cta);
    } else {
      setFocusRegion("form");
      focusField("title");
    }
  }

  function focusCtaButton(cta: TopBarCta) {
    if (cta === "next") nextButtonRef.current?.focus();
    else backButtonRef.current?.focus();
  }

  function handleGetDetails() {
    push("get-from-catalogue", { gameId });
  }

  function applyImported(field: ImportableField) {
    const value = importedValues[field];
    if (value === undefined) return;
    switch (field) {
      case "title":
        setDraftTitle(value);
        setTimeout(() => titleInputRef.current?.focus(), 0);
        break;
      case "publisher":
        setDraftPublisher(value);
        setTimeout(() => publisherInputRef.current?.focus(), 0);
        break;
      case "year":
        setDraftYear(value);
        setTimeout(() => yearInputRef.current?.focus(), 0);
        break;
      case "notes":
        setDraftNotes(value);
        setTimeout(() => notesTextareaRef.current?.focus(), 0);
        break;
    }
    setImportedValues((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setActiveField(field);
    setFocusRegion("form");
  }

  function saveToStore(): boolean {
    const trimmedTitle = draftTitle.trim();
    if (!trimmedTitle) {
      setBottomMessage("Title is required.");
      return false;
    }
    setBottomMessage("");
    setStore((prev) => ({
      ...prev,
      gameDetails: {
        ...prev.gameDetails,
        games: prev.gameDetails.games.map((g): GameDetails => {
          if (g.id !== gameId) return g;
          return {
            ...g,
            title: trimmedTitle,
            publisher: draftPublisher.trim(),
            year: Number.isNaN(Number(draftYear.trim()))
              ? g.year
              : Number(draftYear.trim()) || g.year,
            colourEncoding: draftColourEncoding,
            trueDriveEmulation: draftTrueDriveEmulation,
            notes: draftNotes.trim() || undefined,
          };
        }),
      },
    }));
    return true;
  }

  function handleSaveOrNext() {
    if (!saveToStore()) return;
    if (importMode) {
      push("game-cover-art", {
        gameId,
        importMode: "true",
        ...(importTitle !== undefined ? { importTitle } : {}),
      });
    } else {
      pop();
    }
  }

  function handleNext() {
    if (!saveToStore()) return;
    push("game-cover-art", {
      gameId,
      importMode: "true",
      ...(importTitle !== undefined ? { importTitle } : {}),
    });
  }

  const screenTitle = deriveScreenTitle(
    importMode,
    game?.title ?? "Game",
    fetchSource,
    importTitle,
  );

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">Details</span>
          <div className="screen__topbar-ctas">
            <a
              ref={backButtonRef}
              href="#"
              className="topbar-cta topbar-cta--nav topbar-cta--focused"
              onClick={(e) => {
                e.preventDefault();
                pop();
              }}
            >
              Back
            </a>
          </div>
        </div>
        <div className="screen__content screen__content--empty">
          Game not found.
        </div>
        <div className="screen__bottombar" />
      </div>
    );
  }

  function ctaNavClass(cta: TopBarCta): string {
    const focused = focusRegion === "topbar" && focusedCta === cta;
    return `topbar-cta topbar-cta--nav${focused ? " topbar-cta--focused" : ""}`;
  }

  function ctaActionClass(cta: TopBarCta): string {
    const focused = focusRegion === "topbar" && focusedCta === cta;
    return `topbar-cta topbar-cta--action${focused ? " topbar-cta--focused" : ""}`;
  }

  function fieldActive(field: FormField): boolean {
    return focusRegion === "form" && activeField === field;
  }

  function applyBtnClass(field: FormField): string {
    return `game-details-edit__apply-btn${fieldActive(field) ? " game-details-edit__apply-btn--active" : ""}`;
  }

  function actionBtnClass(field: FormField): string {
    const active = fieldActive(field);
    return `game-details-edit__action-btn${active ? " game-details-edit__action-btn--active" : ""}`;
  }

  return (
    <div
      role="application"
      className="screen"
      ref={containerRef}
      tabIndex={-1}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
        <div className="screen__topbar-ctas">
          {importMode && (
            <button
              ref={nextButtonRef}
              className={ctaActionClass("next")}
              type="button"
              onClick={handleNext}
              onFocus={() => {
                setFocusRegion("topbar");
                setFocusedCta("next");
              }}
            >
              Next
            </button>
          )}
          <a
            ref={backButtonRef}
            href="#"
            className={ctaNavClass("back")}
            onClick={(e) => {
              e.preventDefault();
              pop();
            }}
            onFocus={() => {
              setFocusRegion("topbar");
              setFocusedCta("back");
            }}
          >
            Back
          </a>
        </div>
      </div>

      <div className="screen__content">
        <div className="game-details-edit__layout">
          {/* Title */}
          <div className="game-details-edit__field">
            <label className="game-details-edit__label" htmlFor="gde-title">
              Title
            </label>
            <input
              id="gde-title"
              ref={titleInputRef}
              className={`game-details-edit__input${fieldActive("title") ? " game-details-edit__input--active" : ""}`}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onFocus={() => {
                setActiveField("title");
                setFocusRegion("form");
              }}
            />
          </div>
          <div className="game-details-edit__copy-cell">
            {importedValues.title !== undefined && (
              <button
                ref={applyTitleRef}
                className={applyBtnClass("apply-title")}
                type="button"
                onClick={() => applyImported("title")}
                onFocus={() => {
                  setActiveField("apply-title");
                  setFocusRegion("form");
                }}
              >
                {"<"}
              </button>
            )}
          </div>
          <div className="game-details-edit__fetched-cell">
            {importedValues.title !== undefined ? (
              <span
                className="game-details-edit__fetched-value"
                title={importedValues.title}
              >
                {importedValues.title}
              </span>
            ) : (
              !hasImportedValues && (
                <span className="game-details-edit__prompt">
                  Use [Get Details] to fetch catalogue values.
                </span>
              )
            )}
          </div>

          {/* Publisher */}
          <div className="game-details-edit__field">
            <label className="game-details-edit__label" htmlFor="gde-publisher">
              Publisher
            </label>
            <input
              id="gde-publisher"
              ref={publisherInputRef}
              className={`game-details-edit__input${fieldActive("publisher") ? " game-details-edit__input--active" : ""}`}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={draftPublisher}
              onChange={(e) => setDraftPublisher(e.target.value)}
              onFocus={() => {
                setActiveField("publisher");
                setFocusRegion("form");
              }}
            />
          </div>
          <div className="game-details-edit__copy-cell">
            {importedValues.publisher !== undefined && (
              <button
                ref={applyPublisherRef}
                className={applyBtnClass("apply-publisher")}
                type="button"
                onClick={() => applyImported("publisher")}
                onFocus={() => {
                  setActiveField("apply-publisher");
                  setFocusRegion("form");
                }}
              >
                {"<"}
              </button>
            )}
          </div>
          <div className="game-details-edit__fetched-cell">
            {importedValues.publisher !== undefined && (
              <span
                className="game-details-edit__fetched-value"
                title={importedValues.publisher}
              >
                {importedValues.publisher}
              </span>
            )}
          </div>

          {/* Year */}
          <div className="game-details-edit__field">
            <label className="game-details-edit__label" htmlFor="gde-year">
              Year
            </label>
            <input
              id="gde-year"
              ref={yearInputRef}
              className={`game-details-edit__input${fieldActive("year") ? " game-details-edit__input--active" : ""}`}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={draftYear}
              onChange={(e) => setDraftYear(e.target.value)}
              onFocus={() => {
                setActiveField("year");
                setFocusRegion("form");
              }}
            />
          </div>
          <div className="game-details-edit__copy-cell">
            {importedValues.year !== undefined && (
              <button
                ref={applyYearRef}
                className={applyBtnClass("apply-year")}
                type="button"
                onClick={() => applyImported("year")}
                onFocus={() => {
                  setActiveField("apply-year");
                  setFocusRegion("form");
                }}
              >
                {"<"}
              </button>
            )}
          </div>
          <div className="game-details-edit__fetched-cell">
            {importedValues.year !== undefined && (
              <span
                className="game-details-edit__fetched-value"
                title={importedValues.year}
              >
                {importedValues.year}
              </span>
            )}
          </div>

          {/* Colour Encoding — no fetched counterpart */}
          <div className="game-details-edit__field">
            <label
              className="game-details-edit__label"
              htmlFor="gde-colour-encoding"
            >
              Colour Encoding
            </label>
            <select
              id="gde-colour-encoding"
              ref={colourEncodingSelectRef}
              className={`game-details-edit__input${fieldActive("colourEncoding") ? " game-details-edit__input--active" : ""}`}
              value={draftColourEncoding}
              onChange={(e) =>
                setDraftColourEncoding(
                  e.target.value as "pal" | "ntsc" | "unknown",
                )
              }
              onFocus={() => {
                setActiveField("colourEncoding");
                setFocusRegion("form");
              }}
            >
              <option value="pal">PAL</option>
              <option value="ntsc">NTSC</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div className="game-details-edit__copy-cell" />
          <div className="game-details-edit__fetched-cell" />

          {/* True Drive Emulation — no fetched counterpart */}
          <div className="game-details-edit__field">
            <label className="game-details-edit__label" htmlFor="gde-tde">
              True Drive Emulation
            </label>
            <select
              id="gde-tde"
              ref={trueDriveSelectRef}
              className={`game-details-edit__input${fieldActive("trueDriveEmulation") ? " game-details-edit__input--active" : ""}`}
              value={draftTrueDriveEmulation ? "true" : "false"}
              onChange={(e) =>
                setDraftTrueDriveEmulation(e.target.value === "true")
              }
              onFocus={() => {
                setActiveField("trueDriveEmulation");
                setFocusRegion("form");
              }}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="game-details-edit__copy-cell" />
          <div className="game-details-edit__fetched-cell" />

          {/* Notes */}
          <div className="game-details-edit__field">
            <label className="game-details-edit__label" htmlFor="gde-notes">
              Notes
            </label>
            <textarea
              id="gde-notes"
              ref={notesTextareaRef}
              className={`game-details-edit__input game-details-edit__textarea${fieldActive("notes") ? " game-details-edit__input--active" : ""}`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              onFocus={() => {
                setActiveField("notes");
                setFocusRegion("form");
              }}
              rows={4}
            />
          </div>
          <div className="game-details-edit__copy-cell">
            {importedValues.notes !== undefined && (
              <button
                ref={applyNotesRef}
                className={applyBtnClass("apply-notes")}
                type="button"
                onClick={() => applyImported("notes")}
                onFocus={() => {
                  setActiveField("apply-notes");
                  setFocusRegion("form");
                }}
              >
                {"<"}
              </button>
            )}
          </div>
          <div className="game-details-edit__fetched-cell">
            {importedValues.notes !== undefined && (
              <span
                className="game-details-edit__fetched-value game-details-edit__fetched-value--multiline"
                title={importedValues.notes}
              >
                {importedValues.notes}
              </span>
            )}
          </div>

          {/* Form actions — span all columns */}
          <div className="game-details-edit__actions game-details-edit__actions--span">
            {!importMode && (
              <>
                <button
                  ref={saveButtonRef}
                  className={actionBtnClass("save")}
                  type="button"
                  onClick={handleSaveOrNext}
                  onFocus={() => {
                    setActiveField("save");
                    setFocusRegion("form");
                  }}
                >
                  Save
                </button>
                <button
                  ref={cancelButtonRef}
                  className={actionBtnClass("cancel")}
                  type="button"
                  onClick={pop}
                  onFocus={() => {
                    setActiveField("cancel");
                    setFocusRegion("form");
                  }}
                >
                  Cancel
                </button>
              </>
            )}
            <button
              ref={getDetailsButtonRef}
              className={`${actionBtnClass("get-details")} game-details-edit__action-btn--get-details`}
              type="button"
              onClick={handleGetDetails}
              onFocus={() => {
                setActiveField("get-details");
                setFocusRegion("form");
              }}
            >
              Get Details
            </button>
          </div>
        </div>
      </div>

      <div className="screen__bottombar">{bottomMessage}</div>
    </div>
  );
}
