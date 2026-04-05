import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "form" | "topbar";
type FormField = "name" | "value" | "save" | "cancel";

const FORM_FIELDS: FormField[] = ["name", "value", "save", "cancel"];

function buildViceArgOwnerPrefix(
	type: string | undefined,
	name: string,
): string {
	if (type === "profile") return `Profiles > ${name}`;
	return name;
}

function validateName(name: string): string | null {
	if (!name.trim()) return "Name is required.";
	if (!/^[-+]/.test(name)) return "Name must begin with - or +.";
	if (/\s/.test(name)) return "Name must not contain spaces.";
	return null;
}

function generateId(): string {
	return `arg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ViceArgumentEditScreen() {
	const { pop, currentParams } = useRouter();
	const { store, setStore } = useStore();

	const ownerId = currentParams.ownerId ?? "";
	const argumentId = currentParams.argumentId ?? "";
	const isEditing = Boolean(argumentId);

	const existingArg = isEditing
		? store.viceArguments.arguments.find((a) => a.id === argumentId)
		: undefined;

	const owner = store.viceArguments.owners.find((o) => o.id === ownerId);
	const ownerPrefix = buildViceArgOwnerPrefix(
		owner?.type,
		owner?.name ?? ownerId,
	);

	const [draftName, setDraftName] = useState(existingArg?.name ?? "");
	const [draftValue, setDraftValue] = useState(existingArg?.value ?? "");
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
		const error = validateName(trimmedName);
		if (error) {
			setErrorMessage(error);
			return;
		}
		setErrorMessage("");
		if (isEditing && argumentId) {
			setStore((prev) => ({
				...prev,
				viceArguments: {
					...prev.viceArguments,
					arguments: prev.viceArguments.arguments.map((a) =>
						a.id === argumentId
							? { ...a, name: trimmedName, value: trimmedValue }
							: a,
					),
				},
			}));
		} else {
			const newArg = {
				id: generateId(),
				ownerId,
				name: trimmedName,
				value: trimmedValue,
			};
			setStore((prev) => ({
				...prev,
				viceArguments: {
					...prev.viceArguments,
					arguments: [...prev.viceArguments.arguments, newArg],
				},
			}));
		}
		pop();
	}

	return (
		<div className="screen" ref={containerRef} tabIndex={-1}>
			<div className="screen__topbar">
				<span className="screen__topbar-title">{`${ownerPrefix} > VICE Arguments${draftName ? ` > ${draftName}` : ""}`}</span>
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
						<label className="form__label" htmlFor="vice-argument-name">
							Name
						</label>
						<input
							className={`form__input${activeField === "name" && focusRegion === "form" ? " form__input--active" : ""}`}
							id="vice-argument-name"
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
						<label className="form__label" htmlFor="vice-argument-value">
							Value
						</label>
						<input
							className={`form__input${activeField === "value" && focusRegion === "form" ? " form__input--active" : ""}`}
							id="vice-argument-value"
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
