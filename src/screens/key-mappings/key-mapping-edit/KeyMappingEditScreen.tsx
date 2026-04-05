import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField = "hostKey" | "machineKey" | "save" | "cancel";

const FORM_FIELDS: FormField[] = ["hostKey", "machineKey", "save", "cancel"];

interface KeyGroup {
	label: string;
	keys: string[];
}

const HOST_KEY_GROUPS: KeyGroup[] = [
	{
		label: "Special Keys",
		keys: [
			"Space",
			"Enter",
			"Esc",
			"Tab",
			"Backspace",
			"Home",
			"Page Up",
			"Up Arrow",
			"Down Arrow",
			"Left Arrow",
			"Right Arrow",
			"Left Shift",
			"Right Shift",
			"Left Ctrl",
			"Caps Lock",
		],
	},
	{
		label: "Function Keys",
		keys: ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"],
	},
	{
		label: "Letters",
		keys: "abcdefghijklmnopqrstuvwxyz".split("").map((c) => c.toUpperCase()),
	},
	{
		label: "Digits",
		keys: "0123456789".split(""),
	},
];

const MACHINE_KEY_GROUPS: KeyGroup[] = [
	{
		label: "Special Keys",
		keys: [
			"SPACE",
			"RETURN",
			"RUN/STOP",
			"RESTORE",
			"CTRL",
			"C=",
			"LEFT SHIFT",
			"RIGHT SHIFT",
			"SHIFT LOCK",
			"DEL",
			"CLR/HOME",
			"CRSR UP",
			"CRSR DOWN",
			"CRSR LEFT",
			"CRSR RIGHT",
		],
	},
	{
		label: "Function Keys",
		keys: ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"],
	},
	{
		label: "Letters",
		keys: "abcdefghijklmnopqrstuvwxyz".split("").map((c) => c.toUpperCase()),
	},
	{
		label: "Digits",
		keys: "0123456789".split(""),
	},
];

const HOST_KEYS: string[] = HOST_KEY_GROUPS.flatMap((g) => g.keys);

function generateId(): string {
	return `km-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function validateForm(hostKey: string, machineKey: string): string | null {
	if (!hostKey) return "Host Key is required.";
	if (!machineKey) return "Machine Key is required.";
	return null;
}

export function KeyMappingEditScreen() {
	const { pop, currentParams } = useRouter();
	const { store, setStore } = useStore();

	const ownerId = currentParams.ownerId ?? "";
	const keyMappingId = currentParams.keyMappingId ?? "";
	const isEditing = Boolean(keyMappingId);

	const existing = isEditing
		? store.keyMappings.mappings.find((m) => m.id === keyMappingId)
		: undefined;

	const owner = store.keyMappings.owners.find((o) => o.id === ownerId);
	const ownerPrefix =
		owner?.type === "profile"
			? `Profiles > ${owner.name}`
			: (owner?.name ?? ownerId);

	const mappedHostKeys = isEditing
		? store.keyMappings.mappings
				.filter((m) => m.ownerId === ownerId && m.id !== keyMappingId)
				.map((m) => m.hostKey)
		: store.keyMappings.mappings
				.filter((m) => m.ownerId === ownerId)
				.map((m) => m.hostKey);

	const availableHostKeys = HOST_KEYS.filter(
		(k) => !mappedHostKeys.includes(k),
	);

	const [draftHostKey, setDraftHostKey] = useState(existing?.hostKey ?? "");
	const [draftMachineKey, setDraftMachineKey] = useState(
		existing?.machineKey ?? "",
	);
	const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
	const [activeField, setActiveField] = useState<FormField>("hostKey");
	const [errorMessage, setErrorMessage] = useState("");

	const containerRef = useRef<HTMLDivElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);
	const hostKeySelectRef = useRef<HTMLSelectElement>(null);
	const machineKeySelectRef = useRef<HTMLSelectElement>(null);
	const saveButtonRef = useRef<HTMLButtonElement>(null);
	const cancelButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		hostKeySelectRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const isSelectField =
				focusRegion === "form" &&
				(activeField === "hostKey" || activeField === "machineKey");
			if (isSelectField) {
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
				focusField("hostKey");
				return;
			}
			const delta = event.shiftKey ? -1 : 1;
			const currentIndex = FORM_FIELDS.indexOf(activeField);
			const nextIndex = currentIndex + delta;
			if (nextIndex >= FORM_FIELDS.length || nextIndex < 0) {
				setFocusRegion("topbar");
				backButtonRef.current?.focus();
			} else {
				focusField(FORM_FIELDS[nextIndex] as FormField);
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
		if (field === "hostKey") {
			hostKeySelectRef.current?.focus();
		} else if (field === "machineKey") {
			machineKeySelectRef.current?.focus();
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
		if (activeField === "hostKey") {
			hostKeySelectRef.current?.focus();
		} else if (activeField === "machineKey") {
			machineKeySelectRef.current?.focus();
		} else if (activeField === "save") {
			handleSave();
		} else if (activeField === "cancel") {
			pop();
		}
	}

	function handleSave() {
		const error = validateForm(draftHostKey, draftMachineKey);
		if (error) {
			setErrorMessage(error);
			return;
		}
		setErrorMessage("");
		if (isEditing && keyMappingId) {
			setStore((prev) => ({
				...prev,
				keyMappings: {
					...prev.keyMappings,
					mappings: prev.keyMappings.mappings.map((m) =>
						m.id === keyMappingId
							? { ...m, hostKey: draftHostKey, machineKey: draftMachineKey }
							: m,
					),
				},
			}));
		} else {
			const newMapping = {
				id: generateId(),
				ownerId,
				hostKey: draftHostKey,
				machineKey: draftMachineKey,
			};
			setStore((prev) => ({
				...prev,
				keyMappings: {
					...prev.keyMappings,
					mappings: [...prev.keyMappings.mappings, newMapping],
				},
			}));
		}
		pop();
	}

	return (
		<div className="screen" ref={containerRef} tabIndex={-1}>
			<div className="screen__topbar">
				<span className="screen__topbar-title">{`${ownerPrefix} > Key Mappings${isEditing ? (draftHostKey ? ` > ${draftHostKey}` : "") : " > Add"}`}</span>
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
						<label className="form__label" htmlFor="host-key">
							Host Key
						</label>
						<select
							className={`form__input${activeField === "hostKey" && focusRegion === "form" ? " form__input--active" : ""}`}
							id="host-key"
							ref={hostKeySelectRef}
							value={draftHostKey}
							onChange={(e) => setDraftHostKey(e.target.value)}
							onFocus={() => {
								setActiveField("hostKey");
								setFocusRegion("form");
							}}
						>
							<option value="">—</option>
							{isEditing &&
								existing?.hostKey &&
								!availableHostKeys.includes(existing.hostKey) && (
									<option value={existing.hostKey}>{existing.hostKey}</option>
								)}
							{HOST_KEY_GROUPS.map((group) => {
								const keys = group.keys.filter((k) =>
									availableHostKeys.includes(k),
								);
								if (keys.length === 0) return null;
								return (
									<optgroup key={group.label} label={group.label}>
										{keys.map((key) => (
											<option key={key} value={key}>
												{key}
											</option>
										))}
									</optgroup>
								);
							})}
						</select>
					</div>
					<div className="form__field">
						<label className="form__label" htmlFor="machine-key">
							Machine Key
						</label>
						<select
							className={`form__input${activeField === "machineKey" && focusRegion === "form" ? " form__input--active" : ""}`}
							id="machine-key"
							ref={machineKeySelectRef}
							value={draftMachineKey}
							onChange={(e) => setDraftMachineKey(e.target.value)}
							onFocus={() => {
								setActiveField("machineKey");
								setFocusRegion("form");
							}}
						>
							<option value="">—</option>
							{MACHINE_KEY_GROUPS.map((group) => (
								<optgroup key={group.label} label={group.label}>
									{group.keys.map((key) => (
										<option key={key} value={key}>
											{key}
										</option>
									))}
								</optgroup>
							))}
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
			<div className="screen__bottombar">{errorMessage}</div>
		</div>
	);
}
