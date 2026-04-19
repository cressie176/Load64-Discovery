import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "form";
type FormField = "family" | "save" | "cancel";

const FORM_FIELDS: FormField[] = ["family", "save", "cancel"];

interface ControllerFamilyAssignmentScreenProps {
  controllerId: string;
}

export function ControllerFamilyAssignmentScreen({
  controllerId,
}: ControllerFamilyAssignmentScreenProps) {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const controllerRecord = store.controllers.find((c) => c.id === controllerId);
  const deviceName = controllerRecord?.name ?? controllerId;

  const families = [...store.controllerFamilies.families].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const currentFamilyId =
    store.controllerFamilies.families.find(
      (f) => f.name === controllerRecord?.familyName,
    )?.id ?? "";

  const [draftFamilyId, setDraftFamilyId] = useState<string>(currentFamilyId);
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
  const [activeField, setActiveField] = useState<FormField>("family");

  const containerRef = useRef<HTMLDivElement>(null);
  const familySelectRef = useRef<HTMLSelectElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    familySelectRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeField === "family" && focusRegion === "form") {
        handleSelectKey(event);
        return;
      }
      handleFormKey(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleSelectKey(event: KeyboardEvent) {
    if (event.key === "Tab") {
      familySelectRef.current?.blur();
      handleFormKey(event);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      familySelectRef.current?.blur();
      pop();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      familySelectRef.current?.blur();
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
    if (field === "family") {
      familySelectRef.current?.focus();
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
    if (activeField === "family") {
      familySelectRef.current?.focus();
    } else if (activeField === "save") {
      handleSave();
    } else if (activeField === "cancel") {
      pop();
    }
  }

  function handleSave() {
    const selectedFamilyId = draftFamilyId || null;
    const selectedFamily = selectedFamilyId
      ? store.controllerFamilies.families.find((f) => f.id === selectedFamilyId)
      : null;

    setStore((prev) => ({
      ...prev,
      controllerFamilies: {
        ...prev.controllerFamilies,
        controllers: prev.controllerFamilies.controllers.map((c) =>
          c.id === controllerId ? { ...c, familyId: selectedFamilyId } : c,
        ),
      },
      controllers: prev.controllers.map((c) =>
        c.id === controllerId
          ? { ...c, familyName: selectedFamily?.name ?? undefined }
          : c,
      ),
      controls: {
        ...prev.controls,
        owners: prev.controls.owners.map((o) =>
          o.id === controllerId
            ? {
                ...o,
                familyId: selectedFamilyId ?? undefined,
                familyName: selectedFamily?.name ?? undefined,
              }
            : o,
        ),
      },
    }));
    pop();
  }

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{`Controllers > ${deviceName} > Controller Family`}</span>
      </div>
      <div className="screen__content">
        <div className="form form--two-column-label-left">
          <div className="form__field">
            <label className="form__label" htmlFor="controller-family">
              Family
            </label>
            <select
              className={`form__input${activeField === "family" && focusRegion === "form" ? " form__input--active" : ""}`}
              id="controller-family"
              ref={familySelectRef}
              value={draftFamilyId}
              onChange={(e) => setDraftFamilyId(e.target.value)}
              onFocus={() => {
                setActiveField("family");
                setFocusRegion("form");
              }}
            >
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
              <option value="">None</option>
            </select>
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
      <div className="screen__bottombar" />
    </div>
  );
}
