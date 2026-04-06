import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type {
  BottomBarStatus,
  ConflictState,
  OverlayOption,
  ScreenMode,
} from "./types";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField = "name" | "save" | "discard";

const FORM_FIELDS: FormField[] = ["name", "save", "discard"];
const OVERLAY_OPTIONS: OverlayOption[] = ["overwrite", "rename", "discard"];

function normaliseName(name: string): string {
  return name.trim().toLowerCase();
}

function toFilename(name: string, timestamp: string): string {
  return `${normaliseName(name)}-${timestamp}.vsf`;
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("-");
}

function isNameValid(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (/[/\\:*?"<>|]/.test(trimmed)) return false;
  return true;
}

function buildBottomBarText(status: BottomBarStatus): string {
  switch (status.kind) {
    case "idle":
      return "";
    case "saved":
      return `Snapshot saved: ${status.filename}`;
    case "error":
      return `Failed to save snapshot: ${status.reason}`;
  }
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

interface NowPlayingTakeSnapshotScreenProps {
  gameId: string;
}

export function NowPlayingTakeSnapshotScreen({
  gameId,
}: NowPlayingTakeSnapshotScreenProps) {
  const { pop } = useRouter();
  const { store } = useStore();

  const nowPlaying = store.nowPlaying;
  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const gameTitle = game?.title ?? nowPlaying.gameTitle;

  const [mode, setMode] = useState<ScreenMode>("capture");
  const [name, setName] = useState("");
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [focusedCta] = useState<"back">("back");
  const [activeField, setActiveField] = useState<FormField>("name");
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [bottomBarStatus, setBottomBarStatus] = useState<BottomBarStatus>({
    kind: "idle",
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const discardButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMode("review");
      nameInputRef.current?.focus();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

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
    } else if (event.key === "Enter") {
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

  function activateField() {
    if (activeField === "name") {
      nameInputRef.current?.focus();
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
      commitSave(conflict?.filename ?? "", true);
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
    if (!isNameValid(name)) {
      setBottomBarStatus({ kind: "error", reason: "Name is invalid" });
      return;
    }
    const timestamp = formatTimestamp(new Date());
    const filename = toFilename(name, timestamp);
    commitSave(filename, false);
  }

  function commitSave(filename: string, _overwrite: boolean) {
    setConflict(null);
    setBottomBarStatus({ kind: "saved", filename });
    pop();
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
    "https://placehold.co/320x240/0d0d0d/4040ff?text=Snapshot";

  return (
    <div role="application" className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">
          Now Playing &gt; {gameTitle} &gt; Take Snapshot
        </span>
        <div className="screen__topbar-ctas">
          <button
            ref={backButtonRef}
            className={`topbar-cta${focusRegion === "topbar" && focusedCta === "back" ? " topbar-cta--focused" : ""}`}
            onClick={() => pop()}
            type="button"
          >
            [Back]
          </button>
        </div>
      </div>

      <div className="screen__content">
        {mode === "capture" ? (
          <div className="take-snapshot__capturing">Capturing…</div>
        ) : (
          <div className="take-snapshot">
            <div className="take-snapshot__form-panel">
              <div className="form">
                <div className="form__field">
                  <label className="form__label" htmlFor="snapshot-name">
                    Name
                  </label>
                  <input
                    className={`form__input${activeField === "name" && focusRegion === "form" ? " form__input--active" : ""}`}
                    id="snapshot-name"
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
                  >
                    [Save]
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
                    [Discard]
                  </button>
                </div>
              </div>
            </div>
            <div className="take-snapshot__preview-panel">
              <img
                src={screenshotUrl}
                alt={`${gameTitle} gameplay`}
                className="take-snapshot__preview-image"
              />
            </div>
          </div>
        )}
      </div>

      <div className="screen__bottombar">
        {buildBottomBarText(bottomBarStatus)}
      </div>

      {conflict !== null && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <div className="overlay__title">File already exists</div>
            <p className="take-snapshot__conflict-filename">
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
