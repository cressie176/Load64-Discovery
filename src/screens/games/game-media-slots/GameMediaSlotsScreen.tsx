import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { GameDetails } from "../game-details/types";
import "./index.css";

type MediaSlot =
  | "cover-thumbnail"
  | "loading-screen"
  | "title-screen"
  | "gameplay-screen";

type FocusRegion = "list" | "topbar";
type TopBarCta = "back";

const TOP_BAR_CTAS: TopBarCta[] = ["back"];

const SLOT_DEFINITIONS: { label: string; slot: MediaSlot }[] = [
  { label: "Cover Thumbnail", slot: "cover-thumbnail" },
  { label: "Loading Screen", slot: "loading-screen" },
  { label: "Title Screen", slot: "title-screen" },
  { label: "Gameplay Screen", slot: "gameplay-screen" },
];

export function deriveFilename(url: string | undefined): string {
  if (!url) return "—";
  const lastSegment = url.split("/").pop();
  if (!lastSegment) return "—";
  const withoutQuery = lastSegment.split("?")[0];
  return withoutQuery || "—";
}

export function deriveMediaSlots(
  game: GameDetails,
): { label: string; slot: MediaSlot; filename: string }[] {
  return SLOT_DEFINITIONS.map(({ label, slot }) => {
    let url: string | undefined;
    if (slot === "cover-thumbnail") {
      url = game.coverUrl;
    } else if (slot === "loading-screen") {
      url = game.screenshots.find((s) => s.slot === "loading")?.url;
    } else if (slot === "title-screen") {
      url = game.screenshots.find((s) => s.slot === "title")?.url;
    } else {
      url = game.screenshots.find((s) => s.slot === "gameplay")?.url;
    }
    return { label, slot, filename: deriveFilename(url) };
  });
}

interface GameMediaSlotsScreenProps {
  gameId: string;
}

export function GameMediaSlotsScreen({ gameId }: GameMediaSlotsScreenProps) {
  const { pop, pushFrom, currentParams } = useRouter();
  const { store } = useStore();

  const game = store.gameDetails.games.find((g) => g.id === gameId);

  const [selectedIndex, setSelectedIndex] = useState(
    Number(currentParams.selectedIndex ?? 0),
  );
  const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("back");

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
    if (event.key === "Enter") {
      pop();
    }
  }

  function handleListKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev + 1) % SLOT_DEFINITIONS.length);
    } else if (event.key === "ArrowUp") {
      setSelectedIndex(
        (prev) =>
          (prev - 1 + SLOT_DEFINITIONS.length) % SLOT_DEFINITIONS.length,
      );
    } else if (event.key === "Enter") {
      activateSlot(selectedIndex);
    }
  }

  function activateSlot(index: number) {
    const slotDef = SLOT_DEFINITIONS[index];
    if (!slotDef) return;
    pushFrom({ selectedIndex: String(index) }, "game-media-edit", {
      gameId,
      mediaSlot: slotDef.slot,
    });
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

  if (!game) {
    return (
      <div className="screen" ref={containerRef} tabIndex={-1}>
        <div className="screen__topbar">
          <span className="screen__topbar-title">Media</span>
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

  const slots = deriveMediaSlots(game);

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">{game.title} &gt; Media</span>
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
        <ul className="list">
          {slots.map((slot, index) => (
            <li
              key={slot.slot}
              className={`list__row media-slots__row${index === selectedIndex && focusRegion === "list" ? " list__row--selected" : ""}`}
              onClick={() => {
                setSelectedIndex(index);
                activateSlot(index);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSelectedIndex(index);
                  activateSlot(index);
                }
              }}
            >
              <span className="media-slots__label">{slot.label}</span>
              <span className="media-slots__filename">{slot.filename}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="screen__bottombar" />
    </div>
  );
}
