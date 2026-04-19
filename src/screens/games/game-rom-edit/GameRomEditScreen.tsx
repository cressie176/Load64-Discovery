import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "form";
type FormField = "label" | "save" | "cancel";

const FORM_FIELDS: FormField[] = ["label", "save", "cancel"];

interface GameRomEditScreenProps {
  gameId: string;
  romId: string;
}

export function GameRomEditScreen({ gameId, romId }: GameRomEditScreenProps) {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const roms = store.gameRomList.roms[gameId] ?? [];
  const existingRom = roms.find((r) => r.id === romId);

  const [draftLabel, setDraftLabel] = useState(existingRom?.label ?? "");
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [activeField, setActiveField] = useState<FormField>("label");
  const [errorMessage, setErrorMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    labelInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isLabelActive = focusRegion === "form" && activeField === "label";
      if (isLabelActive) {
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
      labelInputRef.current?.blur();
      handleFormKey(event);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      labelInputRef.current?.blur();
      pop();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      labelInputRef.current?.blur();
      handleSave();
    }
  }

  function handleFormKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      const delta = event.shiftKey ? -1 : 1;
      const currentIndex = FORM_FIELDS.indexOf(activeField);
      const nextIndex =
        (currentIndex + delta + FORM_FIELDS.length) % FORM_FIELDS.length;
      focusField(FORM_FIELDS[nextIndex] as FormField);
      return;
    }
    if (event.key === "Escape") {
      pop();
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
    if (field === "label") {
      labelInputRef.current?.focus();
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
    if (activeField === "label") {
      labelInputRef.current?.focus();
    } else if (activeField === "save") {
      handleSave();
    } else if (activeField === "cancel") {
      pop();
    }
  }

  function handleSave() {
    const trimmedLabel = draftLabel.trim();

    if (!trimmedLabel) {
      setErrorMessage("Label is required.");
      return;
    }
    const labelLower = trimmedLabel.toLowerCase();
    if (
      roms.some((r) => r.id !== romId && r.label.toLowerCase() === labelLower)
    ) {
      setErrorMessage("A ROM with this label already exists.");
      return;
    }

    setErrorMessage("");

    setStore((prev) => {
      const current = prev.gameRomList.roms[gameId] ?? [];
      return {
        ...prev,
        gameRomList: {
          ...prev.gameRomList,
          roms: {
            ...prev.gameRomList.roms,
            [gameId]: current.map((r) =>
              r.id === romId ? { ...r, label: trimmedLabel } : r,
            ),
          },
        },
      };
    });

    pop();
  }

  const gameTitle = game?.title ?? "Game";
  const screenTitle = `${gameTitle} > ROMs > ${existingRom?.label ?? "Edit"}`;

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">ROMs</span>
        </div>
        <div className="screen__content screen__content--empty">
          Game not found.
        </div>
        <div className="screen__bottombar" />
      </div>
    );
  }

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{screenTitle}</span>
      </div>
      <div className="screen__content">
        <div className="form form--two-column-label-left">
          <div className="form__field">
            <span className="form__label">File</span>
            <span className="game-rom-edit__readonly-value">
              {existingRom?.filename ?? ""}
            </span>
          </div>
          <div className="form__field">
            <label className="form__label" htmlFor="rom-label">
              Label
            </label>
            <input
              className={`form__input${activeField === "label" && focusRegion === "form" ? " form__input--active" : ""}`}
              id="rom-label"
              ref={labelInputRef}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onFocus={() => {
                setActiveField("label");
                setFocusRegion("form");
              }}
              onBlur={() => setActiveField("label")}
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
