import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { GameDetails } from "../game-details/types";
import "./index.css";
import { buildFormFields, deriveScreenTitle } from "./utils.ts";

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
  | "fetch"
  | "save"
  | "cancel";

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

  const [fetchSource, setFetchSource] = useState<string | null>(null);
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
  const fetchButtonRef = useRef<HTMLButtonElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const sources = game?.sources ?? [];
  const hasCatalogues = sources.length > 0;

  // Build the form field order dynamically based on which imported values are present
  function buildFormFieldsForRender(): FormField[] {
    return buildFormFields(importedValues, importMode);
  }

  const topBarCtas: TopBarCta[] = importMode ? ["next", "back"] : [];

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const result = store.getCatalogueResult;
    if (!result) return;
    setStore((prev) => ({ ...prev, getCatalogueResult: undefined }));
    const newImported: Partial<Record<ImportableField, string>> = {};
    if (
      result.fetched.title !== undefined &&
      result.fetched.title !== draftTitle
    ) {
      newImported.title = result.fetched.title;
    }
    if (
      result.fetched.publisher !== undefined &&
      result.fetched.publisher !== draftPublisher
    ) {
      newImported.publisher = result.fetched.publisher;
    }
    if (
      result.fetched.year !== undefined &&
      result.fetched.year !== draftYear
    ) {
      newImported.year = result.fetched.year;
    }
    if (
      result.fetched.notes !== undefined &&
      result.fetched.notes !== draftNotes
    ) {
      newImported.notes = result.fetched.notes;
    }
    setImportedValues(newImported);
    setFetchSource(`${result.catalogueName}: ${result.entryId}`);
    setBottomMessage("");
    containerRef.current?.focus();
  }, [
    store.getCatalogueResult,
    draftTitle,
    draftPublisher,
    draftYear,
    draftNotes,
    setStore,
  ]);

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
      if (focusRegion === "topbar") {
        advanceTopBarCta(event.shiftKey);
        return;
      }
      // Blur text inputs before moving focus away from them
      const isTextActive =
        activeField === "title" ||
        activeField === "publisher" ||
        activeField === "year" ||
        activeField === "notes";
      if (isTextActive) {
        getInputRef(activeField)?.blur();
      }
      advanceFormField(event.shiftKey);
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
    } else if (field === "fetch") {
      fetchButtonRef.current?.focus();
    } else if (field === "save") {
      saveButtonRef.current?.focus();
    } else if (field === "cancel") {
      cancelButtonRef.current?.focus();
    }
  }

  function moveField(delta: number) {
    const current = buildFormFieldsForRender();
    const currentIndex = current.indexOf(activeField);
    const nextIndex = (currentIndex + delta + current.length) % current.length;
    focusField(current[nextIndex] as FormField);
  }

  function activateCurrentField() {
    if (activeField === "save") {
      handleSaveOrNext();
    } else if (activeField === "cancel") {
      pop();
    } else if (activeField === "fetch") {
      openFetchMenu();
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

  // Tab forward/backward through form fields (including transfer buttons and action buttons).
  // In import mode, Tab past the last form field advances into the topbar CTAs before wrapping.
  function advanceFormField(reverse: boolean) {
    const fields = buildFormFieldsForRender();
    const currentIndex = fields.indexOf(activeField);
    const nextIndex = currentIndex + (reverse ? -1 : 1);

    if (nextIndex >= 0 && nextIndex < fields.length) {
      focusField(fields[nextIndex] as FormField);
      return;
    }

    if (!reverse && topBarCtas.length > 0) {
      // Tab past last form field → first topbar CTA (import mode)
      const cta = topBarCtas[0];
      setFocusRegion("topbar");
      setFocusedCta(cta);
      focusCtaButton(cta);
    } else if (reverse && topBarCtas.length > 0) {
      // Shift+Tab before first form field → last topbar CTA (import mode)
      const cta = topBarCtas[topBarCtas.length - 1];
      setFocusRegion("topbar");
      setFocusedCta(cta);
      focusCtaButton(cta);
    } else {
      // Non-import mode: wrap around within the form field list
      const wrapIndex =
        (currentIndex + (reverse ? -1 : 1) + fields.length) % fields.length;
      focusField(fields[wrapIndex] as FormField);
    }
  }

  // Tab forward/backward through topbar CTAs (import mode only).
  function advanceTopBarCta(reverse: boolean) {
    const currentIndex = topBarCtas.indexOf(focusedCta);
    const nextIndex = currentIndex + (reverse ? -1 : 1);

    if (nextIndex >= 0 && nextIndex < topBarCtas.length) {
      const nextCta = topBarCtas[nextIndex] as TopBarCta;
      setFocusedCta(nextCta);
      focusCtaButton(nextCta);
      return;
    }

    const fields = buildFormFieldsForRender();
    if (!reverse) {
      // Tab past last topbar CTA → back to first form field
      focusField(fields[0] as FormField);
    } else {
      // Shift+Tab before first topbar CTA → last form field
      focusField(fields[fields.length - 1] as FormField);
    }
  }

  function focusCtaButton(cta: TopBarCta) {
    if (cta === "next") nextButtonRef.current?.focus();
    else backButtonRef.current?.focus();
  }

  function openFetchMenu() {
    if (!hasCatalogues) return;
    push("game-get-from-catalogue", {
      gameId,
      flow: "details",
      importMode: importMode ? "true" : "false",
      ...(importTitle !== undefined ? { importTitle } : {}),
    });
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
    importTitle,
  );

  const fetchHint =
    focusRegion === "form" && activeField === "fetch" && !hasCatalogues
      ? "No catalogues linked. Add a catalogue link to enable fetch."
      : "";

  const effectiveBottomMessage =
    fetchHint ||
    bottomMessage ||
    (fetchSource ? `Details from ${fetchSource}` : "");

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">Game Details</span>
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
    const disabled = field === "fetch" && !hasCatalogues;
    return `game-details-edit__action-btn${active ? " game-details-edit__action-btn--active" : ""}${disabled ? " game-details-edit__action-btn--disabled" : ""}`;
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
        {importMode && (
          <div className="screen__topbar-ctas">
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
        )}
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
            {importedValues.title !== undefined && (
              <span
                className="game-details-edit__fetched-value"
                title={importedValues.title}
              >
                {importedValues.title}
              </span>
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
          <div className="game-details-edit__actions">
            <button
              ref={fetchButtonRef}
              className={actionBtnClass("fetch")}
              type="button"
              disabled={!hasCatalogues}
              onClick={openFetchMenu}
              onFocus={() => {
                setActiveField("fetch");
                setFocusRegion("form");
              }}
            >
              Get Details
            </button>
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
          </div>
        </div>
      </div>

      <div className="screen__bottombar">{effectiveBottomMessage}</div>
    </div>
  );
}
