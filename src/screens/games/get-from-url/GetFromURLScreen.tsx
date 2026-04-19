import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { MediaCandidate } from "../game-media-edit/types";
import type { MediaFlow } from "../get-from-file/media";
import { deriveScreenTitle } from "./url";
import "./index.css";

export { deriveScreenTitle };

function mediaStoreKey(gameId: string, flow: MediaFlow): string {
  if (flow === "cover-art") return `${gameId}-cover-thumbnail`;
  return `${gameId}-screenshots`;
}

type FocusRegion = "form" | "form-actions";
type FormActionCta = "download" | "cancel";

const FORM_ACTION_CTAS: FormActionCta[] = ["download", "cancel"];

interface GetFromURLScreenProps {
  gameId: string;
  flow: MediaFlow;
  importMode: boolean;
  importTitle?: string;
}

export function GetFromURLScreen({
  gameId,
  flow,
  importMode,
  importTitle,
}: GetFromURLScreenProps) {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);

  const [url, setUrl] = useState("");
  const [bottomMessage, setBottomMessage] = useState("");

  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [activeField, setActiveField] = useState<"url">("url");
  const [focusedFormCta, setFocusedFormCta] =
    useState<FormActionCta>("download");

  const containerRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const downloadButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    urlInputRef.current?.focus();
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
      urlInputRef.current?.blur();
      pop();
      return;
    }
    if (focusRegion === "form-actions") {
      handleFormActionsKey(event);
      return;
    }
    // focusRegion === "form"
    if (event.key === "Enter") {
      event.preventDefault();
      urlInputRef.current?.blur();
      handleDownload();
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
      if (focusedFormCta === "download") handleDownload();
      else pop();
    }
  }

  function focusFormActionCta(cta: FormActionCta) {
    setFocusedFormCta(cta);
    setFocusRegion("form-actions");
    if (cta === "download") downloadButtonRef.current?.focus();
    else cancelButtonRef.current?.focus();
  }

  function handleDownload() {
    const trimmed = url.trim();
    if (!trimmed) {
      setBottomMessage("URL is required.");
      return;
    }
    // Simulate download: add a placeholder candidate
    const key = mediaStoreKey(gameId, flow);
    const candidate: MediaCandidate = {
      id: crypto.randomUUID(),
      url: `https://placehold.co/270x360/1a1a2e/4040ff?text=URL+Download`,
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
        focusFormActionCta(FORM_ACTION_CTAS[0] as FormActionCta);
      } else {
        focusFormActionCta(
          FORM_ACTION_CTAS[FORM_ACTION_CTAS.length - 1] as FormActionCta,
        );
      }
    } else {
      // form-actions
      const currentIndex = FORM_ACTION_CTAS.indexOf(focusedFormCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < FORM_ACTION_CTAS.length) {
        focusFormActionCta(FORM_ACTION_CTAS[nextIndex] as FormActionCta);
      } else {
        setFocusRegion("form");
        urlInputRef.current?.focus();
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
            <label className="form__label" htmlFor="gfu-url">
              URL
            </label>
            <input
              id="gfu-url"
              ref={urlInputRef}
              className={`form__input${isFormActive && activeField === "url" ? " form__input--active" : ""}`}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setBottomMessage("");
              }}
              onFocus={() => {
                setActiveField("url");
                setFocusRegion("form");
              }}
            />
          </div>
          <div className="form__actions">
            <button
              ref={downloadButtonRef}
              type="button"
              className={`form__action${isFormActionsActive && focusedFormCta === "download" ? " form__action--active" : ""}`}
              onClick={handleDownload}
              onFocus={() => {
                setFocusedFormCta("download");
                setFocusRegion("form-actions");
              }}
            >
              Download
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
