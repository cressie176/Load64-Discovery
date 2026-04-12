import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { Snapshot, SnapshotGroup, SnapshotListMode } from "./types";
import { buildContextMenuItems } from "./utils";
import "./index.css";

type FocusRegion = "groups" | "snapshots" | "topbar";
type TopBarCta = "back";
type OverlayKind =
  | { kind: "delete-group"; groupName: string }
  | { kind: "delete-snapshot"; snapshot: Snapshot }
  | { kind: "delete-others"; count: number; snapshot: Snapshot }
  | { kind: "delete-subsequent"; count: number; snapshot: Snapshot };

const TOP_BAR_CTAS: TopBarCta[] = ["back"];
const OVERLAY_OPTIONS = ["Yes", "No"] as const;

export function groupsFromSnapshots(snapshots: Snapshot[]): SnapshotGroup[] {
  const map = new Map<string, Snapshot[]>();
  for (const snap of snapshots) {
    const list = map.get(snap.groupName) ?? [];
    list.push(snap);
    map.set(snap.groupName, list);
  }
  return Array.from(map.entries()).map(([name, snaps]) => ({
    name,
    snapshots: [...snaps].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    ),
  }));
}

export function sortGroups(groupNames: string[]): string[] {
  const hasQuickstart = groupNames.includes("quickstart");
  const rest = groupNames
    .filter((n) => n !== "quickstart")
    .sort((a, b) => a.localeCompare(b));
  return hasQuickstart ? ["quickstart", ...rest] : rest;
}

export function formatTimestamp(date: Date): string {
  return `${date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

function buildGroups(snapshots: Snapshot[]): SnapshotGroup[] {
  const raw = groupsFromSnapshots(snapshots);
  const sorted = sortGroups(raw.map((g) => g.name));
  return sorted.map(
    (name) => raw.find((g) => g.name === name) as SnapshotGroup,
  );
}

function wrapIndex(index: number, delta: number, length: number): number {
  return (index + delta + length) % length;
}

interface SnapshotListScreenProps {
  gameId: string;
  mode: SnapshotListMode;
}

export function SnapshotListScreen({ gameId, mode }: SnapshotListScreenProps) {
  const { pop, push } = useRouter();
  const { store, setStore } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const rawSnapshots = store.snapshots.snapshots[gameId] ?? [];
  const groups = buildGroups(rawSnapshots);

  const [focusRegion, setFocusRegion] = useState<FocusRegion>("groups");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("back");
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState(0);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuIndex, setContextMenuIndex] = useState(0);
  const [overlay, setOverlay] = useState<OverlayKind | null>(null);
  const [overlayIndex, setOverlayIndex] = useState(0);
  const [bottomMessage, setBottomMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);

  const safeGroupIndex =
    groups.length > 0 ? Math.min(selectedGroupIndex, groups.length - 1) : 0;
  const focusedGroup = groups[safeGroupIndex];
  const currentSnapshots = focusedGroup?.snapshots ?? [];
  const safeSnapshotIndex =
    currentSnapshots.length > 0
      ? Math.min(selectedSnapshotIndex, currentSnapshots.length - 1)
      : 0;
  const focusedSnapshot = currentSnapshots[safeSnapshotIndex];

  const visibleContextMenuItems = buildContextMenuItems(
    currentSnapshots.length,
    safeSnapshotIndex,
  );

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (overlay !== null) {
        handleOverlayKey(event);
        return;
      }
      if (showContextMenu) {
        handleContextMenuKey(event);
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
    if (focusRegion === "groups") {
      handleGroupsKey(event);
    } else {
      handleSnapshotsKey(event);
    }
  }

  function handleTopBarKey(event: KeyboardEvent) {
    if (event.key === "Enter") {
      pop();
    }
  }

  function handleGroupsKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setSelectedGroupIndex((prev) => wrapIndex(prev, 1, groups.length));
      setSelectedSnapshotIndex(0);
      setBottomMessage("");
    } else if (event.key === "ArrowUp") {
      setSelectedGroupIndex((prev) => wrapIndex(prev, -1, groups.length));
      setSelectedSnapshotIndex(0);
      setBottomMessage("");
    } else if (event.code === "AltLeft" && mode === "manage") {
      event.preventDefault();
      openGroupContextMenu();
    }
  }

  function handleSnapshotsKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setSelectedSnapshotIndex((prev) =>
        wrapIndex(prev, 1, currentSnapshots.length),
      );
      setBottomMessage("");
    } else if (event.key === "ArrowUp") {
      setSelectedSnapshotIndex((prev) =>
        wrapIndex(prev, -1, currentSnapshots.length),
      );
      setBottomMessage("");
    } else if (event.key === "Enter") {
      if (focusedSnapshot) {
        push("now-playing", { gameId });
      }
    } else if (event.code === "AltLeft" && mode === "manage") {
      event.preventDefault();
      openSnapshotContextMenu();
    }
  }

  function handleContextMenuKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setContextMenuIndex((prev) =>
        wrapIndex(prev, 1, visibleContextMenuItems.length),
      );
    } else if (event.key === "ArrowUp") {
      setContextMenuIndex((prev) =>
        wrapIndex(prev, -1, visibleContextMenuItems.length),
      );
    } else if (event.key === "Enter") {
      const action = visibleContextMenuItems[contextMenuIndex];
      setShowContextMenu(false);
      activateContextMenuItem(action);
    } else if (event.key === "Escape") {
      setShowContextMenu(false);
    }
  }

  function activateContextMenuItem(action: string | undefined) {
    if (action === "Delete") {
      openSnapshotDeleteOverlay();
    } else if (action === "Delete Others") {
      openDeleteOthersOverlay();
    } else if (action === "Delete Subsequent") {
      openDeleteSubsequentOverlay();
    }
  }

  function handleOverlayKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setOverlayIndex((prev) => wrapIndex(prev, 1, OVERLAY_OPTIONS.length));
    } else if (event.key === "ArrowUp") {
      setOverlayIndex((prev) => wrapIndex(prev, -1, OVERLAY_OPTIONS.length));
    } else if (event.key === "Enter") {
      if (overlayIndex === 0) {
        confirmOverlay();
      } else {
        closeOverlay();
      }
    } else if (event.key === "Escape") {
      closeOverlay();
    }
  }

  function openGroupContextMenu() {
    if (!focusedGroup) return;
    openGroupDeleteOverlay();
  }

  function openSnapshotContextMenu() {
    if (!focusedSnapshot) return;
    setContextMenuIndex(0);
    setShowContextMenu(true);
  }

  function openGroupDeleteOverlay() {
    if (!focusedGroup) return;
    setOverlay({ kind: "delete-group", groupName: focusedGroup.name });
    setOverlayIndex(0);
  }

  function openSnapshotDeleteOverlay() {
    if (!focusedSnapshot) return;
    setOverlay({ kind: "delete-snapshot", snapshot: focusedSnapshot });
    setOverlayIndex(0);
  }

  function openDeleteOthersOverlay() {
    if (!focusedSnapshot || !focusedGroup) return;
    const othersCount = focusedGroup.snapshots.length - 1;
    setOverlay({
      kind: "delete-others",
      count: othersCount,
      snapshot: focusedSnapshot,
    });
    setOverlayIndex(0);
  }

  function openDeleteSubsequentOverlay() {
    if (!focusedSnapshot || !focusedGroup) return;
    const subsequentCount =
      focusedGroup.snapshots.length - 1 - safeSnapshotIndex;
    setOverlay({
      kind: "delete-subsequent",
      count: subsequentCount,
      snapshot: focusedSnapshot,
    });
    setOverlayIndex(0);
  }

  function confirmOverlay() {
    if (!overlay) return;
    if (overlay.kind === "delete-group") {
      deleteGroup(overlay.groupName);
    } else if (overlay.kind === "delete-snapshot") {
      deleteSnapshot(overlay.snapshot);
    } else if (overlay.kind === "delete-others") {
      deleteOtherSnapshots(overlay.snapshot);
    } else if (overlay.kind === "delete-subsequent") {
      deleteSubsequentSnapshots(overlay.snapshot);
    }
    setOverlay(null);
  }

  function closeOverlay() {
    setOverlay(null);
    containerRef.current?.focus();
  }

  function deleteGroup(groupName: string) {
    setStore((prev) => {
      const remaining = (prev.snapshots.snapshots[gameId] ?? []).filter(
        (s) => s.groupName !== groupName,
      );
      const updatedSnapshots = {
        ...prev.snapshots.snapshots,
        [gameId]: remaining,
      };
      const updatedGame = updateGameFlags(prev, gameId, remaining);
      return {
        ...prev,
        snapshots: { snapshots: updatedSnapshots },
        gameDetails: updatedGame,
      };
    });
    setSelectedGroupIndex(0);
    setSelectedSnapshotIndex(0);
    setBottomMessage(`${groupName} deleted`);
  }

  function deleteSnapshot(snapshot: Snapshot) {
    setStore((prev) => {
      const remaining = (prev.snapshots.snapshots[gameId] ?? []).filter(
        (s) => s.id !== snapshot.id,
      );
      const updatedSnapshots = {
        ...prev.snapshots.snapshots,
        [gameId]: remaining,
      };
      const updatedGame = updateGameFlags(prev, gameId, remaining);
      return {
        ...prev,
        snapshots: { snapshots: updatedSnapshots },
        gameDetails: updatedGame,
      };
    });
    setSelectedSnapshotIndex(0);
    setBottomMessage("Snapshot deleted");
  }

  function deleteOtherSnapshots(keep: Snapshot) {
    setStore((prev) => {
      const all = prev.snapshots.snapshots[gameId] ?? [];
      const groupSnapshots = all.filter((s) => s.groupName === keep.groupName);
      const othersCount = groupSnapshots.filter((s) => s.id !== keep.id).length;
      const remaining = all.filter(
        (s) => s.groupName !== keep.groupName || s.id === keep.id,
      );
      const updatedSnapshots = {
        ...prev.snapshots.snapshots,
        [gameId]: remaining,
      };
      const updatedGame = updateGameFlags(prev, gameId, remaining);
      const message = `${othersCount} snapshot(s) deleted`;
      setBottomMessage(message);
      return {
        ...prev,
        snapshots: { snapshots: updatedSnapshots },
        gameDetails: updatedGame,
      };
    });
    setSelectedSnapshotIndex(0);
  }

  function deleteSubsequentSnapshots(from: Snapshot) {
    setStore((prev) => {
      const all = prev.snapshots.snapshots[gameId] ?? [];
      const groupSnapshots = all
        .filter((s) => s.groupName === from.groupName)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      const fromIndex = groupSnapshots.findIndex((s) => s.id === from.id);
      const toDeleteIds = new Set(
        groupSnapshots.slice(fromIndex + 1).map((s) => s.id),
      );
      const deletedCount = toDeleteIds.size;
      const remaining = all.filter((s) => !toDeleteIds.has(s.id));
      const updatedSnapshots = {
        ...prev.snapshots.snapshots,
        [gameId]: remaining,
      };
      const updatedGame = updateGameFlags(prev, gameId, remaining);
      setBottomMessage(`${deletedCount} snapshot(s) deleted`);
      return {
        ...prev,
        snapshots: { snapshots: updatedSnapshots },
        gameDetails: updatedGame,
      };
    });
  }

  function updateGameFlags(
    prev: typeof store,
    id: string,
    remaining: Snapshot[],
  ) {
    const hasAnySnapshot = remaining.length > 0;
    const hasQuickstart = remaining.some((s) => s.groupName === "quickstart");
    const hasContinue =
      remaining.filter((s) => s.groupName !== "quickstart").length > 0;
    return {
      ...prev.gameDetails,
      games: prev.gameDetails.games.map((g) =>
        g.id === id ? { ...g, hasAnySnapshot, hasQuickstart, hasContinue } : g,
      ),
    };
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "groups") {
      if (reverse) {
        setFocusRegion("topbar");
        setFocusedCta("back");
        backButtonRef.current?.focus();
      } else {
        setFocusRegion("snapshots");
        containerRef.current?.focus();
      }
    } else if (focusRegion === "snapshots") {
      if (reverse) {
        setFocusRegion("groups");
        containerRef.current?.focus();
      } else {
        setFocusRegion("topbar");
        setFocusedCta("back");
        backButtonRef.current?.focus();
      }
    } else {
      const currentIndex = TOP_BAR_CTAS.indexOf(focusedCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < TOP_BAR_CTAS.length) {
        setFocusedCta(TOP_BAR_CTAS[nextIndex] as TopBarCta);
        backButtonRef.current?.focus();
      } else {
        if (reverse) {
          setFocusRegion("snapshots");
        } else {
          setFocusRegion("groups");
        }
        containerRef.current?.focus();
      }
    }
  }

  const gameTitle = game?.title ?? "Game";

  return (
    <div role="application" className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{gameTitle} &gt; Snapshots</span>
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
        <div className="snapshot-list">
          <div className="snapshot-list__panel">
            <div className="snapshot-list__panel-title">GROUPS</div>
            {groups.length === 0 ? (
              <div className="snapshot-list__empty">No snapshots</div>
            ) : (
              <ul className="list">
                {groups.map((group, index) => (
                  <li
                    key={group.name}
                    className={`list__row${index === safeGroupIndex && focusRegion === "groups" ? " list__row--selected" : ""}`}
                    onClick={() => {
                      setFocusRegion("groups");
                      setSelectedGroupIndex(index);
                      setSelectedSnapshotIndex(0);
                      containerRef.current?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setFocusRegion("groups");
                        setSelectedGroupIndex(index);
                        setSelectedSnapshotIndex(0);
                        containerRef.current?.focus();
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (mode === "manage") {
                        setFocusRegion("groups");
                        setSelectedGroupIndex(index);
                        openGroupDeleteOverlay();
                      }
                    }}
                  >
                    {group.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="snapshot-list__panel snapshot-list__panel--right">
            <div className="snapshot-list__panel-title">SNAPSHOTS</div>
            {currentSnapshots.length === 0 ? (
              <div className="snapshot-list__empty">No snapshots in group</div>
            ) : (
              <ul className="list">
                {currentSnapshots.map((snap, index) => (
                  <li
                    key={snap.id}
                    className={`list__row snapshot-list__snapshot-row${index === safeSnapshotIndex && focusRegion === "snapshots" ? " list__row--selected" : ""}`}
                    onClick={() => {
                      setFocusRegion("snapshots");
                      setSelectedSnapshotIndex(index);
                      push("now-playing", { gameId });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setFocusRegion("snapshots");
                        setSelectedSnapshotIndex(index);
                        push("now-playing", { gameId });
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (mode === "manage") {
                        setFocusRegion("snapshots");
                        setSelectedSnapshotIndex(index);
                        setContextMenuIndex(0);
                        setShowContextMenu(true);
                      }
                    }}
                  >
                    {snap.thumbnailUrl ? (
                      <img
                        src={snap.thumbnailUrl}
                        alt="snapshot thumbnail"
                        className="snapshot-list__thumbnail"
                      />
                    ) : (
                      <div className="snapshot-list__thumbnail snapshot-list__thumbnail--placeholder" />
                    )}
                    <span className="snapshot-list__timestamp">
                      {formatTimestamp(snap.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="screen__bottombar">{bottomMessage}</div>

      {showContextMenu && focusedSnapshot && (
        <div
          className="overlay-backdrop"
          style={{ alignItems: "flex-start", paddingTop: "80px" }}
        >
          <div className="overlay">
            <ul className="overlay__list">
              {visibleContextMenuItems.map((item, index) => (
                <li
                  key={item}
                  className={`overlay__row${index === contextMenuIndex ? " overlay__row--selected" : ""}`}
                  onClick={() => {
                    setShowContextMenu(false);
                    activateContextMenuItem(item);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setShowContextMenu(false);
                      activateContextMenuItem(item);
                    }
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {overlay !== null && (
        <div className="overlay-backdrop">
          <div className="overlay">
            {overlay.kind === "delete-group" && (
              <>
                <div className="overlay__title">
                  Delete &quot;{overlay.groupName}&quot;?
                </div>
                <ul className="overlay__list">
                  {OVERLAY_OPTIONS.map((opt, index) => (
                    <li
                      key={opt}
                      className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                      onClick={() => {
                        if (index === 0) {
                          confirmOverlay();
                        } else {
                          closeOverlay();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (index === 0) {
                            confirmOverlay();
                          } else {
                            closeOverlay();
                          }
                        }
                      }}
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {overlay.kind === "delete-snapshot" && (
              <>
                <div className="overlay__title">Delete this snapshot?</div>
                <div className="snapshot-list__overlay-detail">
                  {overlay.snapshot.groupName}
                </div>
                <div className="snapshot-list__overlay-detail">
                  {formatTimestamp(overlay.snapshot.timestamp)}
                </div>
                <ul className="overlay__list">
                  {OVERLAY_OPTIONS.map((opt, index) => (
                    <li
                      key={opt}
                      className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                      onClick={() => {
                        if (index === 0) {
                          confirmOverlay();
                        } else {
                          closeOverlay();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (index === 0) {
                            confirmOverlay();
                          } else {
                            closeOverlay();
                          }
                        }
                      }}
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {overlay.kind === "delete-others" && (
              <>
                <div className="overlay__title">
                  Delete {overlay.count} other snapshot(s)?
                </div>
                <ul className="overlay__list">
                  {OVERLAY_OPTIONS.map((opt, index) => (
                    <li
                      key={opt}
                      className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                      onClick={() => {
                        if (index === 0) {
                          confirmOverlay();
                        } else {
                          closeOverlay();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (index === 0) {
                            confirmOverlay();
                          } else {
                            closeOverlay();
                          }
                        }
                      }}
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {overlay.kind === "delete-subsequent" && (
              <>
                <div className="overlay__title">
                  Delete {overlay.count} subsequent snapshot(s)?
                </div>
                <ul className="overlay__list">
                  {OVERLAY_OPTIONS.map((opt, index) => (
                    <li
                      key={opt}
                      className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
                      onClick={() => {
                        if (index === 0) {
                          confirmOverlay();
                        } else {
                          closeOverlay();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (index === 0) {
                            confirmOverlay();
                          } else {
                            closeOverlay();
                          }
                        }
                      }}
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
