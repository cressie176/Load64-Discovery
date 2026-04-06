import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { BottomBarStatus, ContextMenuAction, DiskItem } from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";
type TopBarCta = "back";

const TOP_BAR_CTAS: TopBarCta[] = ["back"];

function buildDiskItems(
  disks: { label: string; filename: string }[],
): DiskItem[] {
  return [
    ...disks.map(
      (d): DiskItem => ({ kind: "disk", label: d.label, filename: d.filename }),
    ),
    { kind: "other" },
  ];
}

function buildBottomBarText(status: BottomBarStatus): string {
  switch (status.kind) {
    case "current":
      return `Current: Disk ${status.diskNumber} of ${status.total}`;
    case "mounted-disk":
      return `Disk ${status.diskNumber} mounted`;
    case "mounted-file":
      return `${status.filename} mounted`;
    case "ejected":
      return "Disk ejected";
  }
}

function isDiskCurrent(
  item: DiskItem,
  activeDisk: { label: string; filename: string } | null,
): boolean {
  if (item.kind !== "disk" || activeDisk === null) return false;
  return item.filename === activeDisk.filename;
}

interface NowPlayingSwapDisksScreenProps {
  gameId: string;
}

export function NowPlayingSwapDisksScreen({
  gameId,
}: NowPlayingSwapDisksScreenProps) {
  const { pop } = useRouter();
  const { store, setStore } = useStore();

  const nowPlaying = store.nowPlaying;
  const game = store.gameDetails.games.find((g) => g.id === gameId);
  const gameTitle = game?.title ?? nowPlaying.gameTitle;

  const items = buildDiskItems(nowPlaying.disks);
  const totalDisks = nowPlaying.disks.length;
  const currentDiskIndex = nowPlaying.disks.findIndex(
    (d) => d.filename === nowPlaying.activeDisk?.filename,
  );

  const initialStatus: BottomBarStatus =
    currentDiskIndex >= 0
      ? {
          kind: "current",
          diskNumber: currentDiskIndex + 1,
          total: totalDisks,
        }
      : nowPlaying.activeDisk !== null
        ? { kind: "mounted-file", filename: nowPlaying.activeDisk.filename }
        : { kind: "current", diskNumber: 0, total: totalDisks };

  const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("back");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [bottomBarStatus, setBottomBarStatus] =
    useState<BottomBarStatus>(initialStatus);
  const [contextMenu, setContextMenu] = useState<{
    index: number;
    actions: ContextMenuAction[];
  } | null>(null);
  const [contextMenuIndex, setContextMenuIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);

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
    if (contextMenu !== null) {
      handleContextMenuKey(event);
      return;
    }
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
    handleListKey(event);
  }

  function handleTopBarKey(event: KeyboardEvent) {
    if (event.key === "Enter" && focusedCta === "back") {
      pop();
    }
  }

  function handleListKey(event: KeyboardEvent) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex((prev) => Math.max(0, prev - 1));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((prev) => Math.min(items.length - 1, prev + 1));
    } else if (event.key === "Enter") {
      activateItem(focusedIndex);
    } else if (event.key === "Alt") {
      openContextMenuForFocused();
    }
  }

  function handleContextMenuKey(event: KeyboardEvent) {
    if (!contextMenu) return;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setContextMenuIndex((prev) => Math.max(0, prev - 1));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setContextMenuIndex((prev) =>
        Math.min(contextMenu.actions.length - 1, prev + 1),
      );
    } else if (event.key === "Enter") {
      const action = contextMenu.actions[contextMenuIndex];
      if (action) activateContextAction(action);
    } else if (event.key === "Escape" || event.key === "Alt") {
      setContextMenu(null);
    }
  }

  function openContextMenuForFocused() {
    const item = items[focusedIndex];
    if (!item) return;
    if (item.kind === "disk" && isDiskCurrent(item, nowPlaying.activeDisk)) {
      setContextMenu({ index: focusedIndex, actions: ["eject"] });
      setContextMenuIndex(0);
    }
  }

  function activateContextAction(action: ContextMenuAction) {
    setContextMenu(null);
    if (action === "eject") {
      setStore((prev) => ({
        ...prev,
        nowPlaying: { ...prev.nowPlaying, activeDisk: null },
      }));
      setBottomBarStatus({ kind: "ejected" });
      pop();
    }
  }

  function activateItem(index: number) {
    const item = items[index];
    if (!item) return;

    if (item.kind === "other") {
      activateOther();
      return;
    }

    if (isDiskCurrent(item, nowPlaying.activeDisk)) {
      pop();
      return;
    }

    const diskIndex = nowPlaying.disks.findIndex(
      (d) => d.filename === item.filename,
    );
    setStore((prev) => ({
      ...prev,
      nowPlaying: {
        ...prev.nowPlaying,
        activeDisk: { label: item.label, filename: item.filename },
      },
    }));
    setBottomBarStatus({ kind: "mounted-disk", diskNumber: diskIndex + 1 });
    pop();
  }

  function activateOther() {
    const simulatedFilename = "savegame.d64";
    setStore((prev) => ({
      ...prev,
      nowPlaying: {
        ...prev.nowPlaying,
        activeDisk: { label: simulatedFilename, filename: simulatedFilename },
      },
    }));
    setBottomBarStatus({ kind: "mounted-file", filename: simulatedFilename });
    pop();
  }

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "list") {
      const cta = reverse
        ? TOP_BAR_CTAS[TOP_BAR_CTAS.length - 1]
        : TOP_BAR_CTAS[0];
      setFocusRegion("topbar");
      setFocusedCta(cta as TopBarCta);
      focusCtaButton(cta as TopBarCta);
    } else {
      const currentIndex = TOP_BAR_CTAS.indexOf(focusedCta);
      const nextIndex = currentIndex + (reverse ? -1 : 1);
      if (nextIndex >= 0 && nextIndex < TOP_BAR_CTAS.length) {
        const nextCta = TOP_BAR_CTAS[nextIndex] as TopBarCta;
        setFocusedCta(nextCta);
        focusCtaButton(nextCta);
      } else {
        setFocusRegion("list");
        containerRef.current?.focus();
      }
    }
  }

  function focusCtaButton(cta: TopBarCta) {
    if (cta === "back") {
      backButtonRef.current?.focus();
    }
  }

  return (
    <div role="application" className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">
          Now Playing &gt; {gameTitle} &gt; Swap Disks
        </span>
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
        <div className="swap-disks">
          <div className="swap-disks__section-label">Disks</div>
          <ul className="list">
            <li className="list__header">
              <span className="swap-disks__col--label">Label</span>
              <span className="swap-disks__col--filename">Filename</span>
              <span className="swap-disks__col--current">Current</span>
            </li>
            {items.map((item, index) => {
              const selected = focusRegion === "list" && focusedIndex === index;
              const isCurrent =
                item.kind === "disk" &&
                isDiskCurrent(item, nowPlaying.activeDisk);
              return (
                <li
                  key={item.kind === "disk" ? item.filename : "other"}
                  className={`list__row${selected ? " list__row--selected" : ""}`}
                >
                  <span className="swap-disks__col--label">
                    {item.kind === "disk" ? item.label : "Other\u2026"}
                  </span>
                  <span className="swap-disks__col--filename">
                    {item.kind === "disk" ? item.filename : ""}
                  </span>
                  <span className="swap-disks__col--current">
                    {isCurrent ? "Yes" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="screen__bottombar">
        {buildBottomBarText(bottomBarStatus)}
      </div>

      {contextMenu !== null && (
        <div className="overlay-backdrop">
          <div className="overlay">
            <ul className="overlay__list">
              {contextMenu.actions.map((action, i) => (
                <li
                  key={action}
                  className={`overlay__row${contextMenuIndex === i ? " overlay__row--selected" : ""}`}
                >
                  {action === "eject" ? "Eject" : action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
