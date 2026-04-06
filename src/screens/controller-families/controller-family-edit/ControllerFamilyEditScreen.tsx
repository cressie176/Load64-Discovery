import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField = "name" | "save" | "cancel";

const FORM_FIELDS: FormField[] = ["name", "save", "cancel"];

function validateFamilyName(
  name: string,
  existingNames: string[],
  currentName: string | undefined,
): string {
  const trimmed = name.trim();
  if (!trimmed) return "Family name is required.";
  if (trimmed !== currentName && existingNames.includes(trimmed)) {
    return `A family named "${trimmed}" already exists.`;
  }
  return "";
}

function generateFamilyId(name: string): string {
  return `family-${name.trim().toLowerCase().replace(/\s+/g, "-")}`;
}

interface ControllerFamilyEditScreenProps {
  familyId?: string;
}

export function ControllerFamilyEditScreen({
  familyId,
}: ControllerFamilyEditScreenProps) {
  const { pop, replace } = useRouter();
  const { store, setStore } = useStore();

  const isRename = familyId !== undefined;
  const family = isRename
    ? store.controllerFamilies.families.find((f) => f.id === familyId)
    : undefined;

  const [draftName, setDraftName] = useState(family?.name ?? "");
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [activeField, setActiveField] = useState<FormField>("name");
  const [errorMessage, setErrorMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeField === "name" && focusRegion === "form") {
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
      blurNameInput();
      handleFormKey(event);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      blurNameInput();
      pop();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      blurNameInput();
      handleSave();
    }
  }

  function handleFormKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      if (focusRegion === "topbar") {
        setFocusRegion("form");
        focusField("name");
        return;
      }
      const delta = event.shiftKey ? -1 : 1;
      const currentIndex = FORM_FIELDS.indexOf(activeField);
      const nextIndex = currentIndex + delta;
      if (nextIndex >= FORM_FIELDS.length) {
        setFocusRegion("topbar");
        backButtonRef.current?.focus();
      } else if (nextIndex < 0) {
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
    if (field === "name") {
      nameInputRef.current?.focus();
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
    if (activeField === "name") {
      nameInputRef.current?.focus();
    } else if (activeField === "save") {
      handleSave();
    } else if (activeField === "cancel") {
      pop();
    }
  }

  function blurNameInput() {
    nameInputRef.current?.blur();
  }

  function handleSave() {
    const existingNames = store.controllerFamilies.families
      .filter((f) => f.id !== familyId)
      .map((f) => f.name);
    const error = validateFamilyName(draftName, existingNames, family?.name);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage("");
    const trimmedName = draftName.trim();
    if (isRename && familyId) {
      setStore((prev) => ({
        ...prev,
        controllerFamilies: {
          ...prev.controllerFamilies,
          families: prev.controllerFamilies.families.map((f) =>
            f.id === familyId ? { ...f, name: trimmedName } : f,
          ),
        },
      }));
      pop();
    } else {
      const newId = generateFamilyId(trimmedName);
      setStore((prev) => ({
        ...prev,
        controllerFamilies: {
          ...prev.controllerFamilies,
          families: [
            ...prev.controllerFamilies.families,
            { id: newId, name: trimmedName },
          ],
        },
        controls: {
          ...prev.controls,
          owners: [
            ...prev.controls.owners,
            { id: newId, name: trimmedName, type: "family" },
          ],
        },
      }));
      replace("control-list", { ownerId: newId });
    }
  }

  const title = isRename
    ? `Controller Families > ${family?.name ?? ""}`
    : "Controller Families > Add";

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{title}</span>
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
            <label className="form__label" htmlFor="family-name">
              Name *
            </label>
            <input
              className={`form__input${activeField === "name" && focusRegion === "form" ? " form__input--active" : ""}`}
              id="family-name"
              ref={nameInputRef}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onFocus={() => {
                setActiveField("name");
                setFocusRegion("form");
              }}
              onBlur={() => setActiveField("name")}
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
