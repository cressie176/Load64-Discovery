import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { MembershipGame } from "./types";
import "./index.css";

type FocusRegion = "list" | "actions";
type ActionField = "save" | "cancel";

const ACTION_FIELDS: ActionField[] = ["save", "cancel"];

function wrapIndex(index: number, delta: number, length: number): number {
  return (index + delta + length) % length;
}

function sortGamesByTitle(games: MembershipGame[]): MembershipGame[] {
  return [...games].sort((a, b) => a.sortTitle.localeCompare(b.sortTitle));
}

function getSectionKey(sortTitle: string): string {
  const first = sortTitle.charAt(0).toUpperCase();
  if (first >= "0" && first <= "9") return "0-9";
  if (first >= "A" && first <= "Z") return first;
  return "#";
}

function formatSelectedCount(count: number): string {
  return count === 1 ? "1 selected" : `${count} selected`;
}

interface CompilationMembershipScreenProps {
  compilationId: string;
}

export function CompilationMembershipScreen({
  compilationId,
}: CompilationMembershipScreenProps) {
  const { pop, push } = useRouter();
  const { store, setStore } = useStore();

  const compilation = store.compilations.compilations.find(
    (c) => c.id === compilationId,
  );

  const allGames = store.carousel.games;
  const compilationRefs = store.compilations.compilationGameRefs;

  const existingGameIds = new Set(
    compilationRefs
      .filter((ref) => ref.compilationId === compilationId)
      .map((ref) => ref.gameId),
  );

  const eligibleGames: MembershipGame[] = sortGamesByTitle(
    allGames
      .filter((g) => !existingGameIds.has(g.id))
      .map((g) => ({
        id: g.id,
        title: g.title,
        sortTitle: g.sortTitle,
        publisher: g.publisher || undefined,
        year: g.year || undefined,
      })),
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
  const [activeAction, setActiveAction] = useState<ActionField>("save");

  const containerRef = useRef<HTMLDivElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const safeSelectedIndex =
    eligibleGames.length > 0
      ? Math.min(selectedIndex, eligibleGames.length - 1)
      : 0;

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

  function handleListKey(event: KeyboardEvent) {
    if (eligibleGames.length === 0) return;
    if (event.key === "ArrowDown") {
      setSelectedIndex((prev) => wrapIndex(prev, 1, eligibleGames.length));
    } else if (event.key === "ArrowUp") {
      setSelectedIndex((prev) => wrapIndex(prev, -1, eligibleGames.length));
    } else if (event.key === "PageDown") {
      jumpToNextSection();
    } else if (event.key === "PageUp") {
      jumpToPrevSection();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleChecked(eligibleGames[safeSelectedIndex].id);
    } else {
      const char = event.key.toUpperCase();
      if (/^[A-Z0-9]$/.test(char)) {
        jumpToSection(char);
      }
    }
  }

  function jumpToSection(char: string) {
    const target = char >= "0" && char <= "9" ? "0-9" : char;
    const idx = eligibleGames.findIndex(
      (g) => getSectionKey(g.sortTitle) === target,
    );
    if (idx >= 0) setSelectedIndex(idx);
  }

  function jumpToNextSection() {
    if (eligibleGames.length === 0) return;
    const currentSection = getSectionKey(
      eligibleGames[safeSelectedIndex].sortTitle,
    );
    const idx = eligibleGames.findIndex(
      (g, i) =>
        i > safeSelectedIndex && getSectionKey(g.sortTitle) !== currentSection,
    );
    if (idx >= 0) setSelectedIndex(idx);
  }

  function jumpToPrevSection() {
    if (eligibleGames.length === 0) return;
    const currentSection = getSectionKey(
      eligibleGames[safeSelectedIndex].sortTitle,
    );
    const currentSectionStart = eligibleGames.findIndex(
      (g) => getSectionKey(g.sortTitle) === currentSection,
    );
    if (currentSectionStart > 0) {
      const prevSection = getSectionKey(
        eligibleGames[currentSectionStart - 1].sortTitle,
      );
      const idx = eligibleGames.findIndex(
        (g) => getSectionKey(g.sortTitle) === prevSection,
      );
      if (idx >= 0) setSelectedIndex(idx);
    }
  }

  function toggleChecked(gameId: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
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
      // actions
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
    if (checkedIds.size > 0) {
      const newRefs = Array.from(checkedIds).map((gameId) => ({
        compilationId,
        gameId,
      }));
      setStore((prev) => ({
        ...prev,
        compilations: {
          ...prev.compilations,
          compilationGameRefs: [
            ...prev.compilations.compilationGameRefs,
            ...newRefs,
          ],
        },
      }));
    }
    push("compilation-detail", {
      compilationId,
      statusMessage:
        checkedIds.size > 0
          ? `${checkedIds.size} game${checkedIds.size === 1 ? "" : "s"} added`
          : "",
    });
  }

  const isEmpty = eligibleGames.length === 0;
  const selectedCount = checkedIds.size;

  return (
    <div role="application" className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{`Compilations > ${compilation?.name ?? "Compilation"} > Add`}</span>
      </div>
      <div
        className={`screen__content${isEmpty ? " screen__content--empty" : ""}`}
      >
        {isEmpty ? (
          <p>All games are already in this compilation.</p>
        ) : (
          <>
            <div
              className="list__header"
              style={{ display: "flex", gap: "16px" }}
            >
              <span className="compilation-membership__row-checkbox" />
              <span className="compilation-membership__row-title">Title</span>
              <span className="compilation-membership__row-publisher">
                Publisher
              </span>
              <span className="compilation-membership__row-year">Year</span>
            </div>
            <ul className="list">
              {eligibleGames.map((game, index) => (
                <li
                  key={game.id}
                  className={`list__row${index === safeSelectedIndex && focusRegion === "list" ? " list__row--selected" : ""}`}
                  style={{ display: "flex", gap: "16px" }}
                >
                  <span className="compilation-membership__row-checkbox">
                    {checkedIds.has(game.id) ? "[x]" : "[ ]"}
                  </span>
                  <span className="compilation-membership__row-title">
                    {game.title}
                  </span>
                  <span className="compilation-membership__row-publisher">
                    {game.publisher ?? "—"}
                  </span>
                  <span className="compilation-membership__row-year">
                    {game.year ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
            <div
              className="form__actions"
              style={{ paddingLeft: 0, marginTop: "16px" }}
            >
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
          </>
        )}
      </div>
      <div className="screen__bottombar">
        {selectedCount > 0 ? formatSelectedCount(selectedCount) : ""}
      </div>
    </div>
  );
}
