import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { GeneralSettings } from "./types";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField =
	| "gamesDirectory"
	| "catalogueUrl"
	| "showSplashscreen"
	| "save"
	| "cancel";
type Overlay = "createDirectory";

const FORM_FIELDS_WITH_CANCEL: FormField[] = [
	"gamesDirectory",
	"catalogueUrl",
	"showSplashscreen",
	"save",
	"cancel",
];
const FORM_FIELDS_WITHOUT_CANCEL: FormField[] = [
	"gamesDirectory",
	"catalogueUrl",
	"showSplashscreen",
	"save",
];

function isValidUrl(value: string): boolean {
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
}

function deriveBottomBarMessage(
	settings: GeneralSettings,
	errorMessage: string,
	hasSavedDirectory: boolean,
): string {
	if (errorMessage) return errorMessage;
	if (!hasSavedDirectory) return "A games directory is required to continue.";
	if (!settings.catalogueUrl)
		return "Catalogue features are disabled. Enter a Catalogue URL to enable them.";
	return "";
}

interface CreateDirectoryOverlayProps {
	path: string;
	selectedIndex: number;
}

function CreateDirectoryOverlay({
	path,
	selectedIndex,
}: CreateDirectoryOverlayProps) {
	return (
		<div className="overlay-backdrop">
			<div className="overlay">
				<div className="overlay__title">Create directory?</div>
				<div className="overlay__body">{path}</div>
				<ul className="overlay__list">
					<li
						className={`overlay__row${selectedIndex === 0 ? " overlay__row--selected" : ""}`}
					>
						Yes
					</li>
					<li
						className={`overlay__row${selectedIndex === 1 ? " overlay__row--selected" : ""}`}
					>
						No
					</li>
				</ul>
			</div>
		</div>
	);
}

export function GeneralSettingsScreen() {
	const { pop } = useRouter();
	const { store, setStore } = useStore();

	const savedSettings = store.generalSettings;
	const hasSavedDirectory = savedSettings.gamesDirectory.trim() !== "";

	const [draft, setDraft] = useState<GeneralSettings>({
		gamesDirectory: hasSavedDirectory
			? savedSettings.gamesDirectory
			: "~/Documents/Load64/games",
		catalogueUrl: savedSettings.catalogueUrl,
		showSplashscreen: savedSettings.showSplashscreen,
	});
	const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
	const [activeField, setActiveField] = useState<FormField>("gamesDirectory");
	const [errorMessage, setErrorMessage] = useState("");
	const [overlay, setOverlay] = useState<Overlay | null>(null);
	const [overlayIndex, setOverlayIndex] = useState(0);

	const containerRef = useRef<HTMLDivElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);
	const gamesDirectoryRef = useRef<HTMLInputElement>(null);
	const catalogueUrlRef = useRef<HTMLInputElement>(null);
	const showSplashscreenButtonRef = useRef<HTMLButtonElement>(null);
	const saveButtonRef = useRef<HTMLButtonElement>(null);
	const cancelButtonRef = useRef<HTMLButtonElement>(null);

	const formFields = hasSavedDirectory
		? FORM_FIELDS_WITH_CANCEL
		: FORM_FIELDS_WITHOUT_CANCEL;

	useEffect(() => {
		containerRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (overlay) {
				handleOverlayKey(event);
				return;
			}
			if (activeField === "gamesDirectory" || activeField === "catalogueUrl") {
				handleTextInputKey(event);
				return;
			}
			handleFormKey(event);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	});

	function handleTextInputKey(event: KeyboardEvent) {
		if (event.key === "Escape") {
			event.preventDefault();
			setDraft((prev) => ({
				...prev,
				[activeField]:
					activeField === "gamesDirectory"
						? savedSettings.gamesDirectory
						: savedSettings.catalogueUrl,
			}));
			blurActiveInput();
		}
	}

	function handleFormKey(event: KeyboardEvent) {
		if (event.key === "Tab") {
			event.preventDefault();
			if (focusRegion === "topbar") {
				setFocusRegion("form");
				focusField(formFields[0] as FormField);
				return;
			}
			const delta = event.shiftKey ? -1 : 1;
			const currentIndex = formFields.indexOf(activeField);
			const nextIndex = currentIndex + delta;
			if (nextIndex >= formFields.length && hasSavedDirectory) {
				setFocusRegion("topbar");
				backButtonRef.current?.focus();
			} else if (nextIndex < 0 && hasSavedDirectory) {
				setFocusRegion("topbar");
				backButtonRef.current?.focus();
			} else {
				const wrappedIndex =
					(nextIndex + formFields.length) % formFields.length;
				focusField(formFields[wrappedIndex] as FormField);
			}
			return;
		}
		if (event.key === "Escape") {
			if (hasSavedDirectory) {
				pop();
			}
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

	function handleOverlayKey(event: KeyboardEvent) {
		if (event.key === "ArrowDown") {
			setOverlayIndex((prev) => (prev + 1) % 2);
		} else if (event.key === "ArrowUp") {
			setOverlayIndex((prev) => (prev - 1 + 2) % 2);
		} else if (event.key === "Enter") {
			if (overlayIndex === 0) {
				confirmCreateDirectory();
			} else {
				setOverlay(null);
			}
		} else if (event.key === "Escape") {
			setOverlay(null);
		}
	}

	function focusField(field: FormField) {
		setActiveField(field);
		setFocusRegion("form");
		if (field === "gamesDirectory") {
			gamesDirectoryRef.current?.focus();
		} else if (field === "catalogueUrl") {
			catalogueUrlRef.current?.focus();
		} else if (field === "showSplashscreen") {
			showSplashscreenButtonRef.current?.focus();
		} else if (field === "save") {
			saveButtonRef.current?.focus();
		} else if (field === "cancel") {
			cancelButtonRef.current?.focus();
		}
	}

	function moveField(delta: number) {
		const currentIndex = formFields.indexOf(activeField);
		const nextIndex =
			(currentIndex + delta + formFields.length) % formFields.length;
		focusField(formFields[nextIndex] as FormField);
	}

	function activateField() {
		if (activeField === "gamesDirectory") {
			gamesDirectoryRef.current?.focus();
		} else if (activeField === "catalogueUrl") {
			catalogueUrlRef.current?.focus();
		} else if (activeField === "showSplashscreen") {
			setDraft((prev) => ({
				...prev,
				showSplashscreen: !prev.showSplashscreen,
			}));
		} else if (activeField === "save") {
			handleSave();
		} else if (activeField === "cancel") {
			pop();
		}
	}

	function blurActiveInput() {
		gamesDirectoryRef.current?.blur();
		catalogueUrlRef.current?.blur();
	}

	function handleSave() {
		const trimmedDirectory = draft.gamesDirectory.trim();
		if (!trimmedDirectory) {
			setErrorMessage("Games directory is required.");
			return;
		}
		if (draft.catalogueUrl && !isValidUrl(draft.catalogueUrl)) {
			setErrorMessage("Catalogue URL is not a valid URL.");
			return;
		}
		setErrorMessage("");
		// In the POC we simulate directory existence: paths starting with '~' or '/' are treated as existing
		const directoryExists =
			trimmedDirectory.startsWith("/") || trimmedDirectory.startsWith("~");
		if (!directoryExists) {
			setOverlay("createDirectory");
			setOverlayIndex(0);
			return;
		}
		saveAndReturn();
	}

	function confirmCreateDirectory() {
		setOverlay(null);
		saveAndReturn();
	}

	function saveAndReturn() {
		setStore((prev) => ({
			...prev,
			generalSettings: {
				...draft,
				gamesDirectory: draft.gamesDirectory.trim(),
				catalogueUrl: draft.catalogueUrl.trim(),
			},
		}));
		pop();
	}

	const bottomBarMessage = deriveBottomBarMessage(
		draft,
		errorMessage,
		hasSavedDirectory,
	);

	return (
		<div className="screen" ref={containerRef} tabIndex={-1}>
			<div className="screen__topbar">
				<span className="screen__topbar-title">General Settings</span>
				{hasSavedDirectory && (
					<div className="screen__topbar-ctas">
						<button
							ref={backButtonRef}
							className={`topbar-cta${focusRegion === "topbar" ? " topbar-cta--focused" : ""}`}
							onClick={pop}
							type="button"
						>
							[Back]
						</button>
					</div>
				)}
			</div>
			<div className="screen__content">
				<div className="form">
					<div className="form__field">
						<label className="form__label" htmlFor="games-directory">
							Games Directory *
						</label>
						<input
							className={`form__input${activeField === "gamesDirectory" && focusRegion === "form" ? " form__input--active" : ""}`}
							id="games-directory"
							ref={gamesDirectoryRef}
							type="text"
							value={draft.gamesDirectory}
							onChange={(e) =>
								setDraft((prev) => ({
									...prev,
									gamesDirectory: e.target.value,
								}))
							}
							onFocus={() => setActiveField("gamesDirectory")}
							onBlur={() => setActiveField("gamesDirectory")}
						/>
					</div>
					<div className="form__field">
						<label className="form__label" htmlFor="catalogue-url">
							Catalogue URL
						</label>
						<input
							className={`form__input${activeField === "catalogueUrl" && focusRegion === "form" ? " form__input--active" : ""}`}
							id="catalogue-url"
							ref={catalogueUrlRef}
							type="text"
							value={draft.catalogueUrl}
							onChange={(e) =>
								setDraft((prev) => ({ ...prev, catalogueUrl: e.target.value }))
							}
							onFocus={() => setActiveField("catalogueUrl")}
							onBlur={() => setActiveField("catalogueUrl")}
						/>
					</div>
					<div className="form__field">
						<label className="form__label" htmlFor="show-splashscreen">
							Show Splashscreen
						</label>
						<button
							ref={showSplashscreenButtonRef}
							id="show-splashscreen"
							className={`form__toggle${activeField === "showSplashscreen" && focusRegion === "form" ? " form__toggle--active" : ""}`}
							onClick={() =>
								setDraft((prev) => ({
									...prev,
									showSplashscreen: !prev.showSplashscreen,
								}))
							}
							onFocus={() => {
								setActiveField("showSplashscreen");
								setFocusRegion("form");
							}}
							type="button"
						>
							{draft.showSplashscreen ? "[On]" : "[Off]"}
						</button>
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
							[Save]
						</button>
						{hasSavedDirectory && (
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
								[Cancel]
							</button>
						)}
					</div>
				</div>
			</div>
			<div className="screen__bottombar">{bottomBarMessage}</div>
			{overlay === "createDirectory" && (
				<CreateDirectoryOverlay
					path={draft.gamesDirectory.trim()}
					selectedIndex={overlayIndex}
				/>
			)}
		</div>
	);
}
