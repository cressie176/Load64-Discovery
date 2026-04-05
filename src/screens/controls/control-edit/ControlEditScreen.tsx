import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import {
	CANONICAL_CONTROL_LABELS,
	CANONICAL_CONTROL_ORDER,
	type CanonicalControlName,
} from "../control-list/types";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField =
	| "controlName"
	| "canonicalName"
	| "event"
	| "capture"
	| "save"
	| "cancel";

const FORM_FIELDS_FAMILY: FormField[] = [
	"controlName",
	"event",
	"capture",
	"save",
	"cancel",
];
const FORM_FIELDS_CONTROLLER: FormField[] = [
	"controlName",
	"canonicalName",
	"event",
	"capture",
	"save",
	"cancel",
];

function generateId(): string {
	return `ctrl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function validateControlName(
	controlName: string,
	ownerId: string,
	existingEntryId: string | null,
	controls: { id: string; ownerId: string; controlName: string }[],
): string | null {
	if (!controlName.trim()) return "Control Name is required.";
	const duplicate = controls.find(
		(c) =>
			c.ownerId === ownerId &&
			c.controlName === controlName.trim() &&
			c.id !== existingEntryId,
	);
	if (duplicate) return "Control Name must be unique within this owner.";
	return null;
}

function validateEvent(
	event: string,
	canonicalName: CanonicalControlName,
	ownerId: string,
	existingEntryId: string | null,
	controls: {
		id: string;
		ownerId: string;
		canonicalName: string;
		event: string;
	}[],
): string | null {
	if (!event.trim()) return "Event is required.";
	const conflict = controls.find(
		(c) =>
			c.ownerId === ownerId &&
			c.event === event.trim() &&
			c.canonicalName !== canonicalName &&
			c.id !== existingEntryId,
	);
	if (conflict)
		return "Event must map to at most one canonical name within this owner.";
	return null;
}

export function ControlEditScreen() {
	const { pop, currentParams } = useRouter();
	const { store, setStore } = useStore();

	const ownerId = currentParams.ownerId ?? "";
	const canonicalNameParam = (currentParams.canonicalName ??
		"button_south") as CanonicalControlName;

	const owner = store.controls.owners.find((o) => o.id === ownerId);
	const isFamily = owner?.type === "family";

	const existing = store.controls.controls.find(
		(c) => c.ownerId === ownerId && c.canonicalName === canonicalNameParam,
	);

	const ownerLabel = isFamily
		? (owner?.name ?? ownerId)
		: `${owner?.name ?? ownerId} Controls`;

	const formFields = isFamily ? FORM_FIELDS_FAMILY : FORM_FIELDS_CONTROLLER;

	const [draftControlName, setDraftControlName] = useState(
		existing?.controlName ?? "",
	);
	const [draftCanonicalName, setDraftCanonicalName] =
		useState<CanonicalControlName>(
			existing?.canonicalName ?? canonicalNameParam,
		);
	const [draftEvent, setDraftEvent] = useState(existing?.event ?? "");
	const [isCapturing, setIsCapturing] = useState(false);
	const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
	const [activeField, setActiveField] = useState<FormField>("controlName");
	const [errorMessage, setErrorMessage] = useState("");

	const containerRef = useRef<HTMLDivElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);
	const controlNameInputRef = useRef<HTMLInputElement>(null);
	const canonicalNameSelectRef = useRef<HTMLSelectElement>(null);
	const eventInputRef = useRef<HTMLInputElement>(null);
	const captureButtonRef = useRef<HTMLButtonElement>(null);
	const saveButtonRef = useRef<HTMLButtonElement>(null);
	const cancelButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		controlNameInputRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (isCapturing) {
				handleCaptureKey(event);
				return;
			}
			const isTextInput =
				focusRegion === "form" &&
				(activeField === "controlName" || activeField === "event");
			if (isTextInput) {
				handleTextInputKey(event);
				return;
			}
			handleFormKey(event);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	});

	function handleCaptureKey(event: KeyboardEvent) {
		if (event.key === "Escape") {
			event.preventDefault();
			setIsCapturing(false);
			eventInputRef.current?.focus();
			return;
		}
		// In the POC, simulate capturing a keyboard event as a controller event identifier
		// Any key press (except Escape) is treated as a capture event
		event.preventDefault();
		const captured = deriveEventFromKey(event.key);
		setDraftEvent(captured);
		setIsCapturing(false);
		setActiveField("event");
		eventInputRef.current?.focus();
	}

	function handleTextInputKey(event: KeyboardEvent) {
		if (event.key === "Tab") {
			handleFormKey(event);
			return;
		}
		if (event.key === "Escape") {
			event.preventDefault();
			pop();
			return;
		}
		if (event.key === "Enter") {
			event.preventDefault();
			handleSave();
		}
	}

	function handleFormKey(event: KeyboardEvent) {
		if (event.key === "Tab") {
			event.preventDefault();
			if (focusRegion === "topbar") {
				setFocusRegion("form");
				focusField("controlName");
				return;
			}
			const delta = event.shiftKey ? -1 : 1;
			const currentIndex = formFields.indexOf(activeField);
			const nextIndex = currentIndex + delta;
			if (nextIndex >= formFields.length || nextIndex < 0) {
				setFocusRegion("topbar");
				backButtonRef.current?.focus();
			} else {
				focusField(formFields[nextIndex] as FormField);
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
		if (field === "controlName") {
			controlNameInputRef.current?.focus();
		} else if (field === "canonicalName") {
			canonicalNameSelectRef.current?.focus();
		} else if (field === "event") {
			eventInputRef.current?.focus();
		} else if (field === "capture") {
			captureButtonRef.current?.focus();
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
		if (activeField === "controlName") {
			controlNameInputRef.current?.focus();
		} else if (activeField === "canonicalName") {
			canonicalNameSelectRef.current?.focus();
		} else if (activeField === "event") {
			eventInputRef.current?.focus();
		} else if (activeField === "capture") {
			startCapture();
		} else if (activeField === "save") {
			handleSave();
		} else if (activeField === "cancel") {
			pop();
		}
	}

	function startCapture() {
		setIsCapturing(true);
		setErrorMessage("");
	}

	function handleSave() {
		const controlNameError = validateControlName(
			draftControlName,
			ownerId,
			existing?.id ?? null,
			store.controls.controls,
		);
		if (controlNameError) {
			setErrorMessage(controlNameError);
			return;
		}

		const eventError = validateEvent(
			draftEvent,
			draftCanonicalName,
			ownerId,
			existing?.id ?? null,
			store.controls.controls,
		);
		if (eventError) {
			setErrorMessage(eventError);
			return;
		}

		setErrorMessage("");

		if (existing) {
			setStore((prev) => ({
				...prev,
				controls: {
					...prev.controls,
					controls: prev.controls.controls.map((c) =>
						c.id === existing.id
							? {
									...c,
									controlName: draftControlName.trim(),
									canonicalName: draftCanonicalName,
									event: draftEvent.trim(),
								}
							: c,
					),
				},
			}));
		} else {
			const newEntry = {
				id: generateId(),
				ownerId,
				controlName: draftControlName.trim(),
				canonicalName: draftCanonicalName,
				event: draftEvent.trim(),
			};
			setStore((prev) => ({
				...prev,
				controls: {
					...prev.controls,
					controls: [...prev.controls.controls, newEntry],
				},
			}));
		}

		pop();
	}

	const captureButtonLabel = isCapturing ? "[Cancel]" : "[Capture]";
	const bottomBarMessage = isCapturing
		? "Press a control to capture. Escape to cancel."
		: errorMessage;

	return (
		<div className="screen" ref={containerRef} tabIndex={-1}>
			<div className="screen__topbar">
				<span className="screen__topbar-title">{ownerLabel}</span>
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
			</div>
			<div className="screen__content">
				<div className="form">
					<div className="form__field">
						<label className="form__label" htmlFor="control-name">
							Control Name
						</label>
						<input
							className={`form__input${activeField === "controlName" && focusRegion === "form" ? " form__input--active" : ""}`}
							id="control-name"
							ref={controlNameInputRef}
							type="text"
							value={draftControlName}
							onChange={(e) => setDraftControlName(e.target.value)}
							onFocus={() => {
								setActiveField("controlName");
								setFocusRegion("form");
							}}
						/>
					</div>
					<div className="form__field">
						<label className="form__label" htmlFor="canonical-name">
							Canonical Name
						</label>
						{isFamily ? (
							<input
								className="form__input"
								id="canonical-name"
								type="text"
								value={CANONICAL_CONTROL_LABELS[draftCanonicalName]}
								readOnly
								tabIndex={-1}
							/>
						) : (
							<select
								className={`form__input${activeField === "canonicalName" && focusRegion === "form" ? " form__input--active" : ""}`}
								id="canonical-name"
								ref={canonicalNameSelectRef}
								value={draftCanonicalName}
								onChange={(e) =>
									setDraftCanonicalName(e.target.value as CanonicalControlName)
								}
								onFocus={() => {
									setActiveField("canonicalName");
									setFocusRegion("form");
								}}
							>
								{CANONICAL_CONTROL_ORDER.map((name) => (
									<option key={name} value={name}>
										{CANONICAL_CONTROL_LABELS[name]}
									</option>
								))}
							</select>
						)}
					</div>
					<div className="form__field">
						<label className="form__label" htmlFor="event">
							Event
						</label>
						<div className="control-edit__event-row">
							<input
								className={`form__input${activeField === "event" && focusRegion === "form" ? " form__input--active" : ""}`}
								id="event"
								ref={eventInputRef}
								type="text"
								value={isCapturing ? "Waiting..." : draftEvent}
								readOnly={isCapturing}
								onChange={(e) => setDraftEvent(e.target.value)}
								onFocus={() => {
									setActiveField("event");
									setFocusRegion("form");
								}}
							/>
							<button
								ref={captureButtonRef}
								className={`form__action${activeField === "capture" && focusRegion === "form" ? " form__action--active" : ""}`}
								type="button"
								onClick={
									isCapturing ? () => setIsCapturing(false) : startCapture
								}
								onFocus={() => {
									setActiveField("capture");
									setFocusRegion("form");
								}}
							>
								{captureButtonLabel}
							</button>
						</div>
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
					</div>
				</div>
			</div>
			<div className="screen__bottombar">{bottomBarMessage}</div>
		</div>
	);
}

function deriveEventFromKey(key: string): string {
	const map: Record<string, string> = {
		" ": "button_0",
		Enter: "button_1",
		ArrowUp: "axis_1_up",
		ArrowDown: "axis_1_down",
		ArrowLeft: "axis_0_left",
		ArrowRight: "axis_0_right",
	};
	return map[key] ?? `button_${key.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}
