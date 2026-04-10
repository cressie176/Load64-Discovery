import { useEffect, useRef, useState } from "react";
import { BrowseButton } from "../../../components/BrowseButton";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import { renumber } from "../game-rom-list/utils";
import { deriveLabel, isSupportedRomFile } from "./utils";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField = "file" | "browseFile" | "label" | "save" | "cancel";

const FORM_FIELDS: FormField[] = [
  "file",
  "browseFile",
  "label",
  "save",
  "cancel",
];

interface GameRomEditScreenProps {
  gameId: string;
  romId?: string;
}

export function GameRomEditScreen({ gameId, romId }: GameRomEditScreenProps) {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const roms = store.gameRomList.roms[gameId] ?? [];
  const existingRom = romId ? roms.find((r) => r.id === romId) : undefined;
  const isAddMode = !existingRom;

  const [draftFile, setDraftFile] = useState(existingRom?.filename ?? "");
  const [draftLabel, setDraftLabel] = useState(existingRom?.label ?? "");
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [activeField, setActiveField] = useState<FormField>("file");
  const [errorMessage, setErrorMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const browseFileRef = useRef<HTMLButtonElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fileInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isTextInputActive =
        focusRegion === "form" &&
        (activeField === "file" || activeField === "label");
      if (isTextInputActive) {
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
      blurActiveInput();
      handleFormKey(event);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      blurActiveInput();
      pop();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      blurActiveInput();
      handleSave();
    }
  }

  function handleFormKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      if (focusRegion === "topbar") {
        setFocusRegion("form");
        focusField("file");
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
    if (field === "file") {
      fileInputRef.current?.focus();
    } else if (field === "browseFile") {
      browseFileRef.current?.focus();
    } else if (field === "label") {
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
    if (activeField === "file") {
      fileInputRef.current?.focus();
    } else if (activeField === "browseFile") {
      handleBrowseFile(`/home/user/roms/${gameId}-disk1.d64`);
    } else if (activeField === "label") {
      labelInputRef.current?.focus();
    } else if (activeField === "save") {
      handleSave();
    } else if (activeField === "cancel") {
      pop();
    }
  }

  function blurActiveInput() {
    if (activeField === "file") fileInputRef.current?.blur();
    else if (activeField === "label") labelInputRef.current?.blur();
  }

  function handleBrowseFile(selected: string) {
    const filename = selected.includes("/")
      ? (selected.split("/").pop() ?? selected)
      : selected;
    setDraftFile(selected);
    const isOnlyRom = roms.length === 0 || (isAddMode && roms.length === 0);
    const derived = deriveLabel(filename, isOnlyRom);
    setDraftLabel(derived);
    fileInputRef.current?.focus();
    setActiveField("file");
  }

  function handleFileChange(value: string) {
    setDraftFile(value);
    if (value) {
      const filename = value.includes("/")
        ? (value.split("/").pop() ?? value)
        : value;
      const isOnlyRom = isAddMode && roms.length === 0;
      setDraftLabel(deriveLabel(filename, isOnlyRom));
    }
  }

  function handleSave() {
    const trimmedFile = draftFile.trim();
    const trimmedLabel = draftLabel.trim();

    if (!trimmedFile) {
      setErrorMessage("File is required.");
      return;
    }
    if (!isSupportedRomFile(trimmedFile)) {
      setErrorMessage(
        "File must be a supported ROM type (.d64, .d71, .d81, .tap, .t64, .crt).",
      );
      return;
    }
    if (!trimmedLabel) {
      setErrorMessage("Label is required.");
      return;
    }

    setErrorMessage("");

    if (isAddMode) {
      const newId = `rom-${gameId}-${Date.now()}`;
      setStore((prev) => {
        const current = prev.gameRomList.roms[gameId] ?? [];
        return {
          ...prev,
          gameRomList: {
            ...prev.gameRomList,
            roms: {
              ...prev.gameRomList.roms,
              [gameId]: renumber([
                ...current,
                {
                  id: newId,
                  position: current.length + 1,
                  label: trimmedLabel,
                  filename: trimmedFile,
                },
              ]),
            },
          },
        };
      });
    } else {
      setStore((prev) => {
        const current = prev.gameRomList.roms[gameId] ?? [];
        return {
          ...prev,
          gameRomList: {
            ...prev.gameRomList,
            roms: {
              ...prev.gameRomList.roms,
              [gameId]: current.map((r) =>
                r.id === romId
                  ? { ...r, label: trimmedLabel, filename: trimmedFile }
                  : r,
              ),
            },
          },
        };
      });
    }

    pop();
  }

  const gameTitle = game?.title ?? "Game";
  const screenTitle = isAddMode
    ? `${gameTitle} > ROMs > Add`
    : `${gameTitle} > ROMs > ${existingRom?.label ?? "Edit"}`;

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">ROMs</span>
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
            <label className="form__label" htmlFor="rom-file">
              File
            </label>
            <div className="game-rom-edit__input-row">
              <input
                className={`form__input${activeField === "file" && focusRegion === "form" ? " form__input--active" : ""}`}
                id="rom-file"
                ref={fileInputRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={draftFile}
                onChange={(e) => handleFileChange(e.target.value)}
                onFocus={() => {
                  setActiveField("file");
                  setFocusRegion("form");
                }}
                onBlur={() => setActiveField("file")}
              />
              <BrowseButton
                active={activeField === "browseFile" && focusRegion === "form"}
                buttonRef={browseFileRef}
                examplePath={`/home/user/roms/${gameId}-disk1.d64`}
                onFocus={() => {
                  setActiveField("browseFile");
                  setFocusRegion("form");
                }}
                onSelect={handleBrowseFile}
              />
            </div>
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
