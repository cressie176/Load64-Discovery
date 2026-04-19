import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { AssignedProfile } from "./types";
import {
  addProfile,
  buildPendingProfiles,
  buildSaveRefs,
  cancelReorder,
  getUnassignedProfiles,
  moveProfile,
  removeProfile,
  wrapIndex,
} from "./utils";
import "./index.css";

type FocusRegion = "topbar" | "list" | "inherit" | "actions";
type ActionField = "save" | "cancel";

const ACTION_FIELDS: ActionField[] = ["save", "cancel"];

interface GameProfilesSelectionScreenProps {
  gameId: string;
}

export function GameProfilesSelectionScreen({
  gameId,
}: GameProfilesSelectionScreenProps) {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const allProfiles = store.profiles.profiles;
  const gameProfileRefs = store.profiles.gameProfileRefs;

  const [pendingProfiles, setPendingProfiles] = useState<AssignedProfile[]>(
    () => buildPendingProfiles(gameProfileRefs, allProfiles, gameId),
  );
  const [pendingInherit, setPendingInherit] = useState(
    game?.inheritDefaultProfile ?? false,
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusRegion, setFocusRegion] = useState<FocusRegion>(() =>
    buildPendingProfiles(gameProfileRefs, allProfiles, gameId).length === 0
      ? "inherit"
      : "list",
  );
  const [focusedAction, setFocusedAction] = useState<ActionField>("save");
  const [overlay, setOverlay] = useState<
    "context-menu" | "reorder" | "picker" | null
  >(null);
  const [overlayIndex, setOverlayIndex] = useState(0);
  const [reorderOriginIndex, setReorderOriginIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const inheritRef = useRef<HTMLLabelElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const safeSelectedIndex =
    pendingProfiles.length > 0
      ? Math.min(selectedIndex, pendingProfiles.length - 1)
      : 0;

  const unassigned = getUnassignedProfiles(allProfiles, pendingProfiles);
  const allAssigned = unassigned.length === 0;

  const initiallyEmpty = useRef(
    buildPendingProfiles(gameProfileRefs, allProfiles, gameId).length === 0,
  );

  useEffect(() => {
    if (initiallyEmpty.current) {
      inheritRef.current?.focus();
    } else {
      containerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (overlay === "context-menu") {
        handleContextMenuKey(event);
        return;
      }
      if (overlay === "reorder") {
        handleReorderKey(event);
        return;
      }
      if (overlay === "picker") {
        handlePickerKey(event);
        return;
      }
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
      pop();
      return;
    }
    if (focusRegion === "topbar") {
      handleTopBarKey(event);
      return;
    }
    if (focusRegion === "inherit") {
      handleInheritKey(event);
      return;
    }
    if (focusRegion === "actions") {
      handleActionsKey(event);
      return;
    }
    handleListKey(event);
  }

  function handleTopBarKey(event: KeyboardEvent) {
    if (event.key === "Enter") {
      activateAdd();
    }
  }

  function activateAdd() {
    if (allAssigned) return;
    setOverlay("picker");
    setOverlayIndex(0);
  }

  function handleInheritKey(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setPendingInherit((prev) => !prev);
    }
  }

  function handleListKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      if (pendingProfiles.length > 0) {
        setSelectedIndex((prev) => wrapIndex(prev, 1, pendingProfiles.length));
        setStatusMessage("");
      }
    } else if (event.key === "ArrowUp") {
      if (pendingProfiles.length > 0) {
        setSelectedIndex((prev) => wrapIndex(prev, -1, pendingProfiles.length));
        setStatusMessage("");
      }
    } else if (event.key === "Alt") {
      event.preventDefault();
      openContextMenu();
    }
  }

  function handleActionsKey(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      const idx = ACTION_FIELDS.indexOf(focusedAction);
      const next = ACTION_FIELDS[
        wrapIndex(idx, -1, ACTION_FIELDS.length)
      ] as ActionField;
      setFocusedAction(next);
      focusActionButton(next);
    } else if (event.key === "ArrowRight") {
      const idx = ACTION_FIELDS.indexOf(focusedAction);
      const next = ACTION_FIELDS[
        wrapIndex(idx, 1, ACTION_FIELDS.length)
      ] as ActionField;
      setFocusedAction(next);
      focusActionButton(next);
    } else if (event.key === "Enter") {
      if (focusedAction === "save") {
        handleSave();
      } else {
        pop();
      }
    }
  }

  function handleContextMenuKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setOverlayIndex((prev) => wrapIndex(prev, 1, 2));
    } else if (event.key === "ArrowUp") {
      setOverlayIndex((prev) => wrapIndex(prev, -1, 2));
    } else if (event.key === "Enter") {
      if (overlayIndex === 0) {
        setOverlay("reorder");
        setReorderOriginIndex(safeSelectedIndex);
      } else {
        executeRemove();
      }
    } else if (event.key === "Escape") {
      setOverlay(null);
    }
  }

  function handleReorderKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      const nextIndex = Math.min(
        safeSelectedIndex + 1,
        pendingProfiles.length - 1,
      );
      setPendingProfiles((prev) => moveProfile(prev, safeSelectedIndex, 1));
      setSelectedIndex(nextIndex);
    } else if (event.key === "ArrowUp") {
      const nextIndex = Math.max(safeSelectedIndex - 1, 0);
      setPendingProfiles((prev) => moveProfile(prev, safeSelectedIndex, -1));
      setSelectedIndex(nextIndex);
    } else if (event.key === "Enter") {
      setOverlay(null);
    } else if (event.key === "Escape") {
      setPendingProfiles((prev) =>
        cancelReorder(prev, safeSelectedIndex, reorderOriginIndex),
      );
      setSelectedIndex(reorderOriginIndex);
      setOverlay(null);
    }
  }

  function handlePickerKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setOverlayIndex((prev) => wrapIndex(prev, 1, unassigned.length));
    } else if (event.key === "ArrowUp") {
      setOverlayIndex((prev) => wrapIndex(prev, -1, unassigned.length));
    } else if (event.key === "Enter") {
      const profile = unassigned[overlayIndex];
      if (profile) {
        const newIndex = pendingProfiles.length;
        setPendingProfiles((prev) => addProfile(prev, profile));
        setStatusMessage(`${profile.name} added`);
        setSelectedIndex(newIndex);
        setOverlay(null);
      }
    } else if (event.key === "Escape") {
      setOverlay(null);
    }
  }

  function openContextMenu() {
    if (pendingProfiles.length === 0) return;
    setOverlay("context-menu");
    setOverlayIndex(0);
  }

  function executeRemove() {
    const profile = pendingProfiles[safeSelectedIndex];
    if (!profile) return;
    const removedName = profile.name;
    setPendingProfiles((prev) => removeProfile(prev, profile.id));
    setSelectedIndex((prev) => Math.max(0, prev - 1));
    setOverlay(null);
    setStatusMessage(`${removedName} removed`);
    if (pendingProfiles.length <= 1) {
      inheritRef.current?.focus();
      setFocusRegion("inherit");
    } else {
      containerRef.current?.focus();
    }
  }

  function focusInherit() {
    setFocusRegion("inherit");
    inheritRef.current?.focus();
  }

  function focusList() {
    setFocusRegion("list");
    containerRef.current?.focus();
  }

  function toggleFocusRegion(reverse = false) {
    // Tab order per wiki: [Add] (topbar) → LIST → INHERIT → [Save]/[Cancel] (actions) → [Add]
    // When the list is empty, skip the "list" region entirely.
    const isEmpty = pendingProfiles.length === 0;
    if (focusRegion === "topbar") {
      if (!reverse) {
        if (isEmpty) {
          focusInherit();
        } else {
          focusList();
        }
      } else {
        setFocusRegion("actions");
        setFocusedAction("cancel");
        cancelButtonRef.current?.focus();
      }
    } else if (focusRegion === "list") {
      if (!reverse) {
        focusInherit();
      } else {
        setFocusRegion("topbar");
        addButtonRef.current?.focus();
      }
    } else if (focusRegion === "inherit") {
      if (!reverse) {
        setFocusRegion("actions");
        setFocusedAction("save");
        saveButtonRef.current?.focus();
      } else {
        if (isEmpty) {
          setFocusRegion("topbar");
          addButtonRef.current?.focus();
        } else {
          focusList();
        }
      }
    } else {
      // actions
      const currentIndex = ACTION_FIELDS.indexOf(focusedAction);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < ACTION_FIELDS.length) {
        const next = ACTION_FIELDS[nextIndex] as ActionField;
        setFocusedAction(next);
        focusActionButton(next);
      } else if (!reverse) {
        setFocusRegion("topbar");
        addButtonRef.current?.focus();
      } else {
        focusInherit();
      }
    }
  }

  function focusActionButton(field: ActionField) {
    if (field === "save") {
      saveButtonRef.current?.focus();
    } else {
      cancelButtonRef.current?.focus();
    }
  }

  function handleSave() {
    const newRefs = buildSaveRefs(gameId, pendingProfiles);
    setStore((prev) => ({
      ...prev,
      profiles: {
        ...prev.profiles,
        gameProfileRefs: [
          ...prev.profiles.gameProfileRefs.filter((r) => r.gameId !== gameId),
          ...newRefs,
        ],
      },
      gameDetails: {
        ...prev.gameDetails,
        games: prev.gameDetails.games.map((g) =>
          g.id === gameId ? { ...g, inheritDefaultProfile: pendingInherit } : g,
        ),
      },
    }));
    pop();
  }

  function deriveBottomBarMessage(): string {
    if (overlay !== null) return "";
    if (focusRegion === "topbar" && allAssigned) {
      return "All profiles are already assigned.";
    }
    return statusMessage;
  }

  const title = game ? `${game.title} > Profiles` : "Profiles";
  const isEmpty = pendingProfiles.length === 0;
  const bottomBarMessage = deriveBottomBarMessage();

  return (
    <div
      role="application"
      className="screen"
      ref={containerRef}
      tabIndex={-1}
      onContextMenu={(e) => {
        e.preventDefault();
        if (pendingProfiles.length > 0) openContextMenu();
      }}
    >
      <div className="screen__topbar">
        <span className="screen__topbar-title">{title}</span>
        <div className="screen__topbar-ctas">
          <button
            ref={addButtonRef}
            type="button"
            className={`topbar-cta topbar-cta--nav${focusRegion === "topbar" ? " topbar-cta--focused" : ""}${allAssigned ? " topbar-cta--disabled" : ""}`}
            onClick={() => {
              setFocusRegion("topbar");
              activateAdd();
            }}
            onFocus={() => setFocusRegion("topbar")}
          >
            Add
          </button>
        </div>
      </div>
      <div className="screen__content">
        <div className="game-profiles-selection">
          {isEmpty ? (
            <p className="game-profiles-selection__empty">
              Select Add to assign a profile to this game.
            </p>
          ) : (
            <>
              <p className="game-profiles-selection__hint">
                Profiles are applied in order. Use Reorder to change the
                sequence.
              </p>
              <ul className="list">
                {pendingProfiles.map((profile, index) => {
                  const isSelected =
                    index === safeSelectedIndex && focusRegion === "list";
                  const isReordering =
                    overlay === "reorder" && index === safeSelectedIndex;
                  return (
                    <li
                      key={profile.id}
                      className={buildRowClassName(isSelected, isReordering)}
                      style={{ display: "flex" }}
                      onClick={() => {
                        setFocusRegion("list");
                        setSelectedIndex(index);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setFocusRegion("list");
                          setSelectedIndex(index);
                        }
                      }}
                    >
                      <span className="game-profiles-selection__pos">
                        {profile.order}
                      </span>
                      <span className="game-profiles-selection__name">
                        {profile.name}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <label
            ref={inheritRef}
            tabIndex={-1}
            className={`game-profiles-selection__inherit${focusRegion === "inherit" ? " game-profiles-selection__inherit--focused" : ""}`}
            onClick={() => setFocusRegion("inherit")}
            onKeyDown={() => setFocusRegion("inherit")}
          >
            <input
              type="checkbox"
              checked={pendingInherit}
              onChange={() => setPendingInherit((prev) => !prev)}
              style={{ display: "none" }}
            />
            <span className="game-profiles-selection__inherit-checkbox">
              {pendingInherit ? "[x]" : "[ ]"}
            </span>
            <span>Inherit from the default profile (if configured)</span>
          </label>
          <div className="game-profiles-selection__actions">
            <button
              ref={saveButtonRef}
              type="button"
              className={`form__action${focusRegion === "actions" && focusedAction === "save" ? " form__action--active" : ""}`}
              onClick={handleSave}
              onFocus={() => {
                setFocusedAction("save");
                setFocusRegion("actions");
              }}
            >
              Save
            </button>
            <button
              ref={cancelButtonRef}
              type="button"
              className={`form__action${focusRegion === "actions" && focusedAction === "cancel" ? " form__action--active" : ""}`}
              onClick={pop}
              onFocus={() => {
                setFocusedAction("cancel");
                setFocusRegion("actions");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      <div className="screen__bottombar">{bottomBarMessage}</div>
      {overlay === "context-menu" && pendingProfiles[safeSelectedIndex] && (
        <div
          className="overlay-backdrop"
          style={{ alignItems: "flex-start", paddingTop: "80px" }}
        >
          <div className="overlay">
            <ul className="overlay__list">
              {(["Reorder", "Remove"] as const).map((item, index) => (
                <li
                  key={item}
                  className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {overlay === "picker" && unassigned.length > 0 && (
        <div
          className="overlay-backdrop"
          style={{ alignItems: "flex-start", paddingTop: "80px" }}
        >
          <div className="overlay">
            <ul className="overlay__list">
              {unassigned.map((profile, index) => (
                <li
                  key={profile.id}
                  className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                  onClick={() => {
                    const newIndex = pendingProfiles.length;
                    setPendingProfiles((prev) => addProfile(prev, profile));
                    setStatusMessage(`${profile.name} added`);
                    setSelectedIndex(newIndex);
                    setOverlay(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const newIndex = pendingProfiles.length;
                      setPendingProfiles((prev) => addProfile(prev, profile));
                      setStatusMessage(`${profile.name} added`);
                      setSelectedIndex(newIndex);
                      setOverlay(null);
                    }
                  }}
                >
                  {profile.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function buildRowClassName(isSelected: boolean, isReordering: boolean): string {
  const parts = ["list__row"];
  if (isSelected) parts.push("list__row--selected");
  if (isReordering) parts.push("game-profiles-selection__row--reordering");
  return parts.join(" ");
}
