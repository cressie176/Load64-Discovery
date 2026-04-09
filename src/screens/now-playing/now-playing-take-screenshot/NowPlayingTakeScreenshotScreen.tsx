import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { GameDetails } from "../../games/game-details/types";
import type {
  ConflictState,
  MediaSlots,
  OverlayOption,
  ScreenMode,
} from "./types";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField =
  | "name"
  | "checkbox-loading"
  | "checkbox-title"
  | "checkbox-gameplay"
  | "save"
  | "discard";

const FORM_FIELDS: FormField[] = [
  "name",
  "checkbox-loading",
  "checkbox-title",
  "checkbox-gameplay",
  "save",
  "discard",
];
const OVERLAY_OPTIONS: OverlayOption[] = ["overwrite", "rename", "discard"];

const CHECKBOX_FIELDS: Extract<
  FormField,
  "checkbox-loading" | "checkbox-title" | "checkbox-gameplay"
>[] = ["checkbox-loading", "checkbox-title", "checkbox-gameplay"];

const CHECKBOX_SLOT_MAP = {
  "checkbox-loading": "loading",
  "checkbox-title": "title",
  "checkbox-gameplay": "gameplay",
} as const;

const CHECKBOX_LABEL_MAP = {
  "checkbox-loading": "Loading Screen",
  "checkbox-title": "Title Screen",
  "checkbox-gameplay": "Gameplay Screen",
} as const;

function isCheckboxField(
  field: FormField,
): field is "checkbox-loading" | "checkbox-title" | "checkbox-gameplay" {
  return CHECKBOX_FIELDS.includes(
    field as "checkbox-loading" | "checkbox-title" | "checkbox-gameplay",
  );
}

function normaliseName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toFilename(name: string): string {
  return `${normaliseName(name)}.png`;
}

function isNameValid(name: string): boolean {
  return normaliseName(name).length > 0;
}

function getOverlayOptionLabel(option: OverlayOption): string {
  switch (option) {
    case "overwrite":
      return "Overwrite";
    case "rename":
      return "Rename";
    case "discard":
      return "Discard";
  }
}

export function applyMediaSlots(
  games: GameDetails[],
  gameId: string,
  filename: string,
  slots: MediaSlots,
): GameDetails[] {
  return games.map((game) => {
    if (game.id !== gameId) return game;
    const checkedSlots = (
      Object.entries(slots) as [keyof MediaSlots, boolean][]
    ).filter(([, checked]) => checked);
    if (checkedSlots.length === 0) return game;
    const updatedScreenshots = game.screenshots.filter(
      (s) => !slots[s.slot as keyof MediaSlots],
    );
    for (const [slot] of checkedSlots) {
      updatedScreenshots.push({ slot, url: filename });
    }
    return { ...game, screenshots: updatedScreenshots };
  });
}

interface NowPlayingTakeScreenshotScreenProps {
  gameId: string;
}

export function NowPlayingTakeScreenshotScreen({
  gameId,
}: NowPlayingTakeScreenshotScreenProps) {
  const { pop, popWith } = useRouter();
  const { store, setStore } = useStore();

  const nowPlaying = store.nowPlaying;
  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const gameTitle = game?.title ?? nowPlaying.gameTitle;

  const [mode, setMode] = useState<ScreenMode>("capture");
  const [name, setName] = useState("");
  const [mediaSlots, setMediaSlots] = useState<MediaSlots>({
    loading: false,
    title: false,
    gameplay: false,
  });
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [focusedCta] = useState<"back">("back");
  const [activeField, setActiveField] = useState<FormField>("name");
  const [conflict, setConflict] = useState<ConflictState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const discardButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMode("review");
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mode === "review") {
      nameInputRef.current?.focus();
    }
  }, [mode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleMainKey(event);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleMainKey(event: KeyboardEvent) {
    if (conflict !== null) {
      handleOverlayKey(event);
      return;
    }
    if (mode === "capture") return;
    if (event.key === "Tab") {
      event.preventDefault();
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
    if (activeField === "name") {
      handleNameInputKey(event);
    } else {
      handleFormKey(event);
    }
  }

  function handleTopBarKey(event: KeyboardEvent) {
    if (event.key === "Enter" && focusedCta === "back") {
      pop();
    }
  }

  function handleNameInputKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      nameInputRef.current?.blur();
      handleFormKey(event);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      nameInputRef.current?.blur();
      handleFormKey(event);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      nameInputRef.current?.blur();
      pop();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      nameInputRef.current?.blur();
      executeSave();
    }
  }

  function handleFormKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveField(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveField(-1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateField();
    }
  }

  function handleOverlayKey(event: KeyboardEvent) {
    if (!conflict) return;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocusedOption(-1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocusedOption(1);
    } else if (event.key === "Enter") {
      activateOverlayOption(conflict.focusedOption);
    } else if (event.key === "Escape") {
      closeOverlay();
    }
  }

  function moveField(delta: number) {
    const currentIndex = FORM_FIELDS.indexOf(activeField);
    const nextIndex =
      (currentIndex + delta + FORM_FIELDS.length) % FORM_FIELDS.length;
    focusField(FORM_FIELDS[nextIndex] as FormField);
  }

  function focusField(field: FormField) {
    setActiveField(field);
    setFocusRegion("form");
    if (field === "name") {
      nameInputRef.current?.focus();
    } else if (field === "save") {
      saveButtonRef.current?.focus();
    } else if (field === "discard") {
      discardButtonRef.current?.focus();
    }
  }

  function toggleCheckbox(
    slot: "checkbox-loading" | "checkbox-title" | "checkbox-gameplay",
  ) {
    const key = CHECKBOX_SLOT_MAP[slot];
    setMediaSlots((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function activateField() {
    if (activeField === "name") {
      nameInputRef.current?.focus();
    } else if (isCheckboxField(activeField)) {
      toggleCheckbox(activeField);
    } else if (activeField === "save") {
      executeSave();
    } else if (activeField === "discard") {
      executeDiscard();
    }
  }

  function moveFocusedOption(delta: number) {
    if (!conflict) return;
    const currentIndex = OVERLAY_OPTIONS.indexOf(conflict.focusedOption);
    const nextIndex =
      (currentIndex + delta + OVERLAY_OPTIONS.length) % OVERLAY_OPTIONS.length;
    setConflict({
      ...conflict,
      focusedOption: OVERLAY_OPTIONS[nextIndex] as OverlayOption,
    });
  }

  function activateOverlayOption(option: OverlayOption) {
    if (option === "overwrite") {
      saveScreenshot(true);
    } else if (option === "rename") {
      closeOverlay();
      focusField("name");
    } else {
      executeDiscard();
    }
  }

  function closeOverlay() {
    setConflict(null);
  }

  function executeSave() {
    if (!isNameValid(name)) return;
    const filename = toFilename(name);
    const existingSlotNames =
      game?.screenshots.map((s) => `${s.slot}.png`) ?? [];
    if (existingSlotNames.includes(filename)) {
      setConflict({ filename, focusedOption: "overwrite" });
      return;
    }
    saveScreenshot(false);
  }

  function saveScreenshot(_overwrite: boolean) {
    const filename = toFilename(name);
    setConflict(null);
    setStore((prev) => ({
      ...prev,
      gameDetails: {
        ...prev.gameDetails,
        games: applyMediaSlots(
          prev.gameDetails.games,
          gameId,
          filename,
          mediaSlots,
        ),
      },
    }));
    popWith({ outcomeMessage: `Screenshot saved: ${filename}` });
  }

  function executeDiscard() {
    setConflict(null);
    pop();
  }

  function toggleFocusRegion(reverse = false) {
    const TOP_BAR_CTAS = ["back"] as const;
    if (focusRegion === "form") {
      backButtonRef.current?.focus();
      setFocusRegion("topbar");
    } else {
      const currentIndex = TOP_BAR_CTAS.indexOf(focusedCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < TOP_BAR_CTAS.length) {
        backButtonRef.current?.focus();
      } else {
        setFocusRegion("form");
        focusField("name");
      }
    }
  }

  const screenshotUrl =
    nowPlaying.gameplayScreenshotUrl ??
    "https://placehold.co/320x240/0d0d0d/4040ff?text=Screenshot";

  return (
    <div role="application" className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">
          Now Playing &gt; {gameTitle} &gt; Take Screenshot
        </span>
        <div className="screen__topbar-ctas">
          <a
            ref={backButtonRef}
            href="#"
            className={`topbar-cta topbar-cta--nav${focusRegion === "topbar" && focusedCta === "back" ? " topbar-cta--focused" : ""}`}
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
        {mode === "capture" ? (
          <div className="take-screenshot__capturing">Capturing…</div>
        ) : (
          <div className="take-screenshot">
            <div className="take-screenshot__form-panel">
              <div className="form">
                <div className="form__field">
                  <label className="form__label" htmlFor="screenshot-name">
                    Name
                  </label>
                  <input
                    className={`form__input${activeField === "name" && focusRegion === "form" ? " form__input--active" : ""}`}
                    id="screenshot-name"
                    ref={nameInputRef}
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => {
                      setActiveField("name");
                      setFocusRegion("form");
                    }}
                  />
                </div>
                <div className="take-screenshot__media-slots">
                  <span className="take-screenshot__media-slots-label">
                    Set as
                  </span>
                  {CHECKBOX_FIELDS.map((field) => {
                    const slot = CHECKBOX_SLOT_MAP[field];
                    const checked = mediaSlots[slot];
                    const isActive =
                      activeField === field && focusRegion === "form";
                    return (
                      <button
                        key={field}
                        type="button"
                        className={`take-screenshot__checkbox-row${isActive ? " take-screenshot__checkbox-row--active" : ""}`}
                        onClick={() => {
                          setActiveField(field);
                          setFocusRegion("form");
                          toggleCheckbox(field);
                        }}
                        onFocus={() => {
                          setActiveField(field);
                          setFocusRegion("form");
                        }}
                      >
                        {checked ? "[x]" : "[ ]"} {CHECKBOX_LABEL_MAP[field]}
                      </button>
                    );
                  })}
                </div>
                <div className="form__actions">
                  <button
                    ref={saveButtonRef}
                    className={`form__action${activeField === "save" && focusRegion === "form" ? " form__action--active" : ""}`}
                    onClick={executeSave}
                    onFocus={() => {
                      setActiveField("save");
                      setFocusRegion("form");
                    }}
                    type="button"
                    disabled={!isNameValid(name)}
                  >
                    Save
                  </button>
                  <button
                    ref={discardButtonRef}
                    className={`form__action${activeField === "discard" && focusRegion === "form" ? " form__action--active" : ""}`}
                    onClick={executeDiscard}
                    onFocus={() => {
                      setActiveField("discard");
                      setFocusRegion("form");
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
            <div className="take-screenshot__preview-panel">
              <img
                src={screenshotUrl}
                alt={`${gameTitle} screenshot`}
                className="take-screenshot__preview-image"
              />
            </div>
          </div>
        )}
      </div>

      <div className="screen__bottombar" />

      {conflict !== null && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">File already exists</div>
            <p className="take-screenshot__conflict-filename">
              {conflict.filename}
            </p>
            <ul className="overlay__list">
              {OVERLAY_OPTIONS.map((option) => (
                <li
                  key={option}
                  className={`overlay__row${conflict.focusedOption === option ? " overlay__row--selected" : ""}`}
                >
                  {getOverlayOptionLabel(option)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
