import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField = "name" | "value" | "save" | "cancel";

const FORM_FIELDS: FormField[] = ["name", "value", "save", "cancel"];

function buildEnvVarOwnerPrefix(
	type: string | undefined,
	name: string,
): string {
	switch (type) {
		case "family":
			return `Controller Families > ${name}`;
		case "controller":
			return `Controllers > ${name}`;
		case "profile":
			return `Profiles > ${name}`;
		default:
			return name;
	}
}

function validateForm(name: string, existingNames: string[]): string | null {
	if (!name.trim()) return "Name is required.";
	if (existingNames.includes(name.trim()))
		return `${name.trim()} already exists.`;
	return null;
}

function generateId(): string {
	return `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function EnvironmentVariableEditScreen() {
	const { pop, currentParams } = useRouter();
	const { store, setStore } = useStore();

	const ownerId = currentParams.ownerId ?? "";
	const envVarId = currentParams.envVarId ?? "";
	const isEditing = Boolean(envVarId);

	const existing = isEditing
		? store.environmentVariables.variables.find((v) => v.id === envVarId)
		: undefined;

	const owner = store.environmentVariables.owners.find((o) => o.id === ownerId);
	const ownerPrefix = buildEnvVarOwnerPrefix(
		owner?.type,
		owner?.name ?? ownerId,
	);

	const existingNames = isEditing
		? store.environmentVariables.variables
				.filter((v) => v.ownerId === ownerId && v.id !== envVarId)
				.map((v) => v.name)
		: store.environmentVariables.variables
				.filter((v) => v.ownerId === ownerId)
				.map((v) => v.name);

	const [draftName, setDraftName] = useState(existing?.name ?? "");
	const [draftValue, setDraftValue] = useState(existing?.value ?? "");
	const [focusRegion, setFocusRegion] = useState<FocusRegion>("form");
	const [activeField, setActiveField] = useState<FormField>("name");
	const [errorMessage, setErrorMessage] = useState("");

	const containerRef = useRef<HTMLDivElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const valueInputRef = useRef<HTMLInputElement>(null);
	const saveButtonRef = useRef<HTMLButtonElement>(null);
	const cancelButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		nameInputRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const isTextInput =
				focusRegion === "form" &&
				(activeField === "name" || activeField === "value");
			if (isTextInput) {
				handleTextInputKey(event);
				return;
			}
			handleFormKey(event);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	});

	function handleTextInputKey(event: KeyboardEvent) {
		if (event.key === "Tab") {
			blurActiveInput();
			handleFormKey(event);
			return;
		}
		if (event.key === "Escape") {
			event.preventDefault();
			blurActiveInput();
			pop();
			return;
		}
		if (event.key === "Enter") {
			event.preventDefault();
			blurActiveInput();
			handleSave();
		}
	}

	function handleFormKey(event: KeyboardEvent) {
		if (event.key === "Tab") {
			event.preventDefault();
			if (focusRegion === "topbar") {
				setFocusRegion("form");
				focusField("name");
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
		if (field === "name") {
			nameInputRef.current?.focus();
		} else if (field === "value") {
			valueInputRef.current?.focus();
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
		if (activeField === "name") {
			nameInputRef.current?.focus();
		} else if (activeField === "value") {
			valueInputRef.current?.focus();
		} else if (activeField === "save") {
			handleSave();
		} else if (activeField === "cancel") {
			pop();
		}
	}

	function blurActiveInput() {
		if (activeField === "name") {
			nameInputRef.current?.blur();
		} else if (activeField === "value") {
			valueInputRef.current?.blur();
		}
	}

	function handleSave() {
		const trimmedName = draftName.trim();
		const trimmedValue = draftValue.trim();
		const error = validateForm(trimmedName, existingNames);
		if (error) {
			setErrorMessage(error);
			return;
		}
		setErrorMessage("");
		if (isEditing && envVarId) {
			setStore((prev) => ({
				...prev,
				environmentVariables: {
					...prev.environmentVariables,
					variables: prev.environmentVariables.variables.map((v) =>
						v.id === envVarId
							? { ...v, name: trimmedName, value: trimmedValue }
							: v,
					),
				},
			}));
		} else {
			const newVar = {
				id: generateId(),
				ownerId,
				name: trimmedName,
				value: trimmedValue,
			};
			setStore((prev) => ({
				...prev,
				environmentVariables: {
					...prev.environmentVariables,
					variables: [...prev.environmentVariables.variables, newVar],
				},
			}));
		}
		pop();
	}

	return (
		<div className="screen" ref={containerRef} tabIndex={-1}>
			<div className="screen__topbar">
				<span className="screen__topbar-title">{`${ownerPrefix} > Environment Variables${draftName ? ` > ${draftName}` : ""}`}</span>
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
						<label className="form__label" htmlFor="env-var-name">
							Name
						</label>
						<input
							className={`form__input${activeField === "name" && focusRegion === "form" ? " form__input--active" : ""}`}
							id="env-var-name"
							ref={nameInputRef}
							type="text"
							value={draftName}
							onChange={(e) => setDraftName(e.target.value)}
							onFocus={() => {
								setActiveField("name");
								setFocusRegion("form");
							}}
						/>
					</div>
					<div className="form__field">
						<label className="form__label" htmlFor="env-var-value">
							Value
						</label>
						<input
							className={`form__input${activeField === "value" && focusRegion === "form" ? " form__input--active" : ""}`}
							id="env-var-value"
							ref={valueInputRef}
							type="text"
							value={draftValue}
							onChange={(e) => setDraftValue(e.target.value)}
							onFocus={() => {
								setActiveField("value");
								setFocusRegion("form");
							}}
						/>
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
