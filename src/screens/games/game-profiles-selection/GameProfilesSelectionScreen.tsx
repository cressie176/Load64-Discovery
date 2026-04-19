import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { GameProfilesSelectionRow } from "./types";
import "./index.css";

type FocusRegion = "list" | "actions";
type ActionField = "save" | "cancel";

const ACTION_FIELDS: ActionField[] = ["save", "cancel"];

function wrapIndex(index: number, delta: number, length: number): number {
  return (index + delta + length) % length;
}

function buildRows(
  profiles: { id: string; name: string; isDefault: boolean }[],
): GameProfilesSelectionRow[] {
  const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name));
  const defaultProfile = profiles.find((p) => p.isDefault);

  const namedRows: GameProfilesSelectionRow[] = sorted.map((p) => ({
    kind: "profile",
    id: p.id,
    name: p.name,
  }));

  if (!defaultProfile) {
    return namedRows;
  }

  return [
    ...namedRows,
    {
      kind: "section-heading",
      label: "Automatically inherit configuration from the default profiles:",
    },
    { kind: "default-profile", defaultProfileName: defaultProfile.name },
  ];
}

function isSelectableRow(row: GameProfilesSelectionRow): boolean {
  return row.kind !== "section-heading";
}

interface GameProfilesSelectionScreenProps {
  gameId: string;
}

export function GameProfilesSelectionScreen({
  gameId,
}: GameProfilesSelectionScreenProps) {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const profiles = store.profiles.profiles;
  const gameProfileRefs = store.profiles.gameProfileRefs;

  const existingProfileIds = new Set(
    gameProfileRefs
      .filter((ref) => ref.gameId === gameId)
      .map((ref) => ref.profileId),
  );

  const rows = buildRows(profiles);
  const defaultProfile = profiles.find((p) => p.isDefault);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pendingDefaultProfile, setPendingDefaultProfile] = useState(
    game?.inheritDefaultProfile ?? false,
  );
  const [pendingProfileIds, setPendingProfileIds] = useState<Set<string>>(
    () => new Set(existingProfileIds),
  );
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
  const [activeAction, setActiveAction] = useState<ActionField>("save");

  const containerRef = useRef<HTMLDivElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
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
      pop();
      return;
    }
    if (focusRegion === "actions") {
      handleActionsKey(event);
      return;
    }
    handleListKey(event);
  }

  function handleActionsKey(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      const idx = ACTION_FIELDS.indexOf(activeAction);
      const next = ACTION_FIELDS[
        wrapIndex(idx, -1, ACTION_FIELDS.length)
      ] as ActionField;
      setActiveAction(next);
      focusActionButton(next);
    } else if (event.key === "ArrowRight") {
      const idx = ACTION_FIELDS.indexOf(activeAction);
      const next = ACTION_FIELDS[
        wrapIndex(idx, 1, ACTION_FIELDS.length)
      ] as ActionField;
      setActiveAction(next);
      focusActionButton(next);
    } else if (event.key === "Enter") {
      if (activeAction === "save") {
        handleSave();
      } else {
        pop();
      }
    }
  }

  function moveSelection(delta: number) {
    setSelectedIndex((prev) => {
      let next = prev + delta;
      while (next >= 0 && next < rows.length) {
        if (isSelectableRow(rows[next])) return next;
        next += delta;
      }
      return prev;
    });
  }

  function handleListKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      moveSelection(1);
    } else if (event.key === "ArrowUp") {
      moveSelection(-1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const row = rows[selectedIndex];
      if (row && isSelectableRow(row)) {
        toggleRow(row);
      }
    }
  }

  function toggleRow(row: GameProfilesSelectionRow) {
    if (row.kind === "section-heading") return;
    if (row.kind === "default-profile") {
      setPendingDefaultProfile((prev) => !prev);
    } else {
      setPendingProfileIds((prev) => {
        const next = new Set(prev);
        if (next.has(row.id)) {
          next.delete(row.id);
        } else {
          next.add(row.id);
        }
        return next;
      });
    }
  }

  function isRowChecked(row: GameProfilesSelectionRow): boolean {
    if (row.kind === "section-heading") return false;
    if (row.kind === "default-profile") return pendingDefaultProfile;
    return pendingProfileIds.has(row.id);
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "list") {
      if (reverse) {
        setFocusRegion("actions");
        setActiveAction("cancel");
        cancelButtonRef.current?.focus();
      } else {
        setFocusRegion("actions");
        setActiveAction("save");
        saveButtonRef.current?.focus();
      }
    } else {
      setFocusRegion("list");
      containerRef.current?.focus();
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
    const newRefs = Array.from(pendingProfileIds).map((profileId) => ({
      gameId,
      profileId,
    }));
    setStore((prev) => ({
      ...prev,
      profiles: {
        ...prev.profiles,
        gameProfileRefs: [
          ...prev.profiles.gameProfileRefs.filter(
            (ref) => ref.gameId !== gameId,
          ),
          ...newRefs,
        ],
      },
      gameDetails: {
        ...prev.gameDetails,
        games: prev.gameDetails.games.map((g) =>
          g.id === gameId
            ? { ...g, inheritDefaultProfile: pendingDefaultProfile }
            : g,
        ),
      },
    }));
    pop();
  }

  function deriveBottomBarMessage(): string {
    if (focusRegion !== "list") return "";
    const focusedRow = rows[selectedIndex];
    if (!focusedRow) return "";
    if (focusedRow.kind === "default-profile") {
      return "Inherited configuration will change if the default profile changes.";
    }
    if (focusedRow.kind !== "profile") return "";
    if (!pendingDefaultProfile) return "";
    if (focusedRow.id !== defaultProfile?.id) return "";
    return "Included via default. Select explicitly to inherit regardless of default.";
  }

  const title = game ? `${game.title} > Profiles` : "Profiles";
  const hasNamedProfiles = rows.some((r) => r.kind === "profile");
  const bottomBarMessage = deriveBottomBarMessage();

  return (
    <div role="application" className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{title}</span>
      </div>
      <div className="screen__content">
        <div className="game-profiles-selection">
          {hasNamedProfiles && (
            <p className="game-profiles-selection__section-heading">
              Automatically inherit configuration from the following profiles:
            </p>
          )}
          <ul className="list">
            {rows.map((row, index) => {
              if (row.kind === "section-heading") {
                return (
                  <li
                    key="section-heading-default"
                    className="game-profiles-selection__section-heading"
                    aria-hidden="true"
                  >
                    {row.label}
                  </li>
                );
              }
              const label =
                row.kind === "default-profile"
                  ? `Default → ${row.defaultProfileName}`
                  : row.name;
              const checked = isRowChecked(row);
              const isSelected =
                index === selectedIndex && focusRegion === "list";
              return (
                <li
                  key={
                    row.kind === "default-profile" ? "default-profile" : row.id
                  }
                  className={`list__row${isSelected ? " list__row--selected" : ""}`}
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                  onClick={() => {
                    setSelectedIndex(index);
                    toggleRow(row);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedIndex(index);
                      toggleRow(row);
                    }
                  }}
                >
                  <span className="game-profiles-selection__checkbox">
                    {checked ? "[x]" : "[ ]"}
                  </span>
                  <span>{label}</span>
                </li>
              );
            })}
          </ul>
          <div className="form__actions">
            <button
              ref={saveButtonRef}
              className={`form__action${focusRegion === "actions" && activeAction === "save" ? " form__action--active" : ""}`}
              onClick={handleSave}
              onFocus={() => {
                setActiveAction("save");
                setFocusRegion("actions");
              }}
              type="button"
            >
              Save
            </button>
            <button
              ref={cancelButtonRef}
              className={`form__action${focusRegion === "actions" && activeAction === "cancel" ? " form__action--active" : ""}`}
              onClick={pop}
              onFocus={() => {
                setActiveAction("cancel");
                setFocusRegion("actions");
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      <div className="screen__bottombar">{bottomBarMessage}</div>
    </div>
  );
}
