import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "content" | "topbar";
type TopBarCta = "update" | "back";

const SIMULATED_UPDATE_DELAY_MS = 1500;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} at ${hours}:${minutes}`;
}

function bumpVersion(version: string): string {
  const parts = version.split(".");
  if (parts.length < 3) return version;
  const major = Number(parts[0]);
  const minor = Number(parts[1]) + 1;
  return `${major}.${minor}.0`;
}

function deriveBottomBarMessage(
  hasCatalogueUrl: boolean,
  isUpdating: boolean,
  statusMessage: string,
): string {
  if (!hasCatalogueUrl) {
    return "Catalogue features are disabled. Enter a Catalogue URL to enable them.";
  }
  if (isUpdating) return "Updating catalogue\u2026";
  return statusMessage;
}

export function Load64CatalogueUpdateScreen() {
  const { pop } = useRouter();
  const { store, setStore } = useStore();
  const { catalogueUrl } = store.generalSettings;
  const { version, lastUpdated } = store.catalogue;

  const hasCatalogueUrl = catalogueUrl.trim() !== "";
  const topBarCtas: TopBarCta[] = hasCatalogueUrl
    ? ["update", "back"]
    : ["back"];

  const [focusRegion, setFocusRegion] = useState<FocusRegion>("content");
  const [focusedCta, setFocusedCta] = useState<TopBarCta>("back");
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const updateButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        toggleFocusRegion(event.shiftKey);
        return;
      }
      if (event.key === "Escape") {
        pop();
        return;
      }
      if (focusRegion === "topbar" && event.key === "Enter") {
        activateCta(focusedCta);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function toggleFocusRegion(reverse = false) {
    if (focusRegion === "content") {
      const cta = reverse ? topBarCtas[topBarCtas.length - 1] : topBarCtas[0];
      setFocusRegion("topbar");
      setFocusedCta(cta as TopBarCta);
      focusCtaButton(cta as TopBarCta);
    } else {
      const currentIdx = topBarCtas.indexOf(focusedCta);
      const nextIdx = currentIdx + (reverse ? -1 : 1);
      if (nextIdx >= 0 && nextIdx < topBarCtas.length) {
        const next = topBarCtas[nextIdx] as TopBarCta;
        setFocusedCta(next);
        focusCtaButton(next);
      } else {
        setFocusRegion("content");
        containerRef.current?.focus();
      }
    }
  }

  function focusCtaButton(cta: TopBarCta) {
    if (cta === "update") updateButtonRef.current?.focus();
    else backButtonRef.current?.focus();
  }

  function activateCta(cta: TopBarCta) {
    if (cta === "update") handleUpdate();
    else pop();
  }

  function handleUpdate() {
    if (isUpdating) return;
    setIsUpdating(true);
    setStatusMessage("");
    setTimeout(() => {
      const newVersion = bumpVersion(version ?? "1.0.0");
      const newLastUpdated = new Date().toISOString();
      setStore((prev) => ({
        ...prev,
        catalogue: { version: newVersion, lastUpdated: newLastUpdated },
      }));
      setIsUpdating(false);
      setStatusMessage("Catalogue updated successfully.");
    }, SIMULATED_UPDATE_DELAY_MS);
  }

  const urlDisplay = catalogueUrl.trim() || "Not configured";
  const versionDisplay = version ?? "\u2014";
  const lastUpdatedDisplay = lastUpdated
    ? formatTimestamp(lastUpdated)
    : "Never";
  const bottomBarMessage = deriveBottomBarMessage(
    hasCatalogueUrl,
    isUpdating,
    statusMessage,
  );

  function ctaClass(cta: TopBarCta, variant: "nav" | "action"): string {
    const focused = focusRegion === "topbar" && focusedCta === cta;
    return `topbar-cta topbar-cta--${variant}${focused ? " topbar-cta--focused" : ""}`;
  }

  return (
    <div className="screen" ref={containerRef} tabIndex={-1}>
      <div className="screen__topbar">
        <span className="screen__topbar-title">Update Load!64 Catalogue</span>
        <div className="screen__topbar-ctas">
          {hasCatalogueUrl && !isUpdating && (
            <button
              ref={updateButtonRef}
              className={ctaClass("update", "nav")}
              onClick={handleUpdate}
              type="button"
            >
              Update
            </button>
          )}
          <a
            ref={backButtonRef}
            href="#"
            className={ctaClass("back", "nav")}
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
            <span className="form__label">Catalogue URL</span>
            <span className="catalogue-update__url-value">{urlDisplay}</span>
          </div>
          <div className="form__field">
            <span className="form__label">Version</span>
            <span>{versionDisplay}</span>
          </div>
          <div className="form__field">
            <span className="form__label">Last updated</span>
            <span>{lastUpdatedDisplay}</span>
          </div>
        </div>
      </div>
      <div className="screen__bottombar">{bottomBarMessage}</div>
    </div>
  );
}
