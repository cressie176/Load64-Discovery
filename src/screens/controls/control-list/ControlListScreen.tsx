import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import {
	CANONICAL_CONTROL_LABELS,
	CANONICAL_CONTROL_ORDER,
	type CanonicalControlName,
	type ControlRow,
	type ControlsState,
} from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";
type Overlay = "context-menu" | "delete";

const DELETE_OPTIONS = ["Yes", "No"] as const;

function buildRows(ownerId: string, state: ControlsState): ControlRow[] {
	const owner = state.owners.find((o) => o.id === ownerId);
	if (!owner) return [];

	const ownedControls = state.controls.filter((c) => c.ownerId === ownerId);
	const familyControls =
		owner.familyId != null
			? state.controls.filter((c) => c.ownerId === owner.familyId)
			: [];

	return CANONICAL_CONTROL_ORDER.map((canonicalName) => {
		const owned = ownedControls.find((c) => c.canonicalName === canonicalName);
		const inherited = familyControls.find(
			(c) => c.canonicalName === canonicalName,
		);

		if (owner.type === "family") {
			return buildFamilyRow(canonicalName, owned ?? null);
		}
		return buildControllerRow(
			canonicalName,
			owned ?? null,
			inherited ?? null,
			owner.familyName,
		);
	});
}

function buildFamilyRow(
	canonicalName: CanonicalControlName,
	owned: { id: string; controlName: string; event: string } | null,
): ControlRow {
	return {
		canonicalName,
		canonicalLabel: CANONICAL_CONTROL_LABELS[canonicalName],
		controlName: owned?.controlName || "—",
		event: owned?.event || "—",
		sourceLabel: null,
		isInherited: false,
		entryId: owned?.id ?? null,
	};
}

function buildControllerRow(
	canonicalName: CanonicalControlName,
	owned: { id: string; controlName: string; event: string } | null,
	inherited: { id: string; controlName: string; event: string } | null,
	familyName: string | undefined,
): ControlRow {
	if (owned) {
		return {
			canonicalName,
			canonicalLabel: CANONICAL_CONTROL_LABELS[canonicalName],
			controlName: owned.controlName || "—",
			event: owned.event || "—",
			sourceLabel: "—",
			isInherited: false,
			entryId: owned.id,
		};
	}
	if (inherited) {
		return {
			canonicalName,
			canonicalLabel: CANONICAL_CONTROL_LABELS[canonicalName],
			controlName: inherited.controlName,
			event: inherited.event,
			sourceLabel: familyName ?? "Family",
			isInherited: true,
			entryId: inherited.id,
		};
	}
	return {
		canonicalName,
		canonicalLabel: CANONICAL_CONTROL_LABELS[canonicalName],
		controlName: "—",
		event: "—",
		sourceLabel: "—",
		isInherited: false,
		entryId: null,
	};
}

function wrapIndex(index: number, delta: number, length: number): number {
	return (index + delta + length) % length;
}

interface ControlListScreenProps {
	ownerId: string;
	statusMessage?: string;
}

export function ControlListScreen({
	ownerId,
	statusMessage: initialStatusMessage = "",
}: ControlListScreenProps) {
	const { pop, push } = useRouter();
	const { store, setStore } = useStore();

	const rows = buildRows(ownerId, store.controls);
	const owner = store.controls.owners.find((o) => o.id === ownerId);

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
	const [overlay, setOverlay] = useState<Overlay | null>(null);
	const [overlayIndex, setOverlayIndex] = useState(0);
	const [contextMenuItems, setContextMenuItems] = useState<string[]>([]);
	const [statusMessage, setStatusMessage] = useState(initialStatusMessage);

	const containerRef = useRef<HTMLDivElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);

	const safeSelectedIndex =
		rows.length > 0 ? Math.min(selectedIndex, rows.length - 1) : 0;
	const focusedRow = rows[safeSelectedIndex];
	const isControllerContext = owner?.type === "controller";

	useEffect(() => {
		containerRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (overlay === "context-menu") {
				handleContextMenuKey(event);
				return;
			}
			if (overlay === "delete") {
				handleDeleteOverlayKey(event);
				return;
			}
			handleMainKey(event);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	});

	function handleContextMenuKey(event: KeyboardEvent) {
		if (event.key === "ArrowDown") {
			setOverlayIndex((prev) => wrapIndex(prev, 1, contextMenuItems.length));
		} else if (event.key === "ArrowUp") {
			setOverlayIndex((prev) => wrapIndex(prev, -1, contextMenuItems.length));
		} else if (event.key === "Enter") {
			const action = contextMenuItems[overlayIndex];
			setOverlay(null);
			if (action === "Clear") {
				confirmClear();
			} else if (action === "Delete") {
				setOverlay("delete");
				setOverlayIndex(0);
			}
		} else if (event.key === "Escape") {
			setOverlay(null);
		}
	}

	function handleDeleteOverlayKey(event: KeyboardEvent) {
		if (event.key === "ArrowDown") {
			setOverlayIndex((prev) => wrapIndex(prev, 1, DELETE_OPTIONS.length));
		} else if (event.key === "ArrowUp") {
			setOverlayIndex((prev) => wrapIndex(prev, -1, DELETE_OPTIONS.length));
		} else if (event.key === "Enter") {
			if (overlayIndex === 0) {
				confirmDelete();
			} else {
				setOverlay(null);
			}
		} else if (event.key === "Escape") {
			setOverlay(null);
		}
	}

	function handleMainKey(event: KeyboardEvent) {
		if (event.key === "Tab") {
			event.preventDefault();
			toggleFocusRegion();
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
		if (rows.length === 0) return;
		if (event.key === "ArrowDown") {
			setSelectedIndex((prev) => wrapIndex(prev, 1, rows.length));
			setStatusMessage("");
		} else if (event.key === "ArrowUp") {
			setSelectedIndex((prev) => wrapIndex(prev, -1, rows.length));
			setStatusMessage("");
		} else if (event.key === "Enter") {
			activateRow(focusedRow);
		} else if (event.key === "Alt") {
			event.preventDefault();
			openContextMenuIfEligible();
		}
	}

	function activateRow(row: ControlRow | undefined) {
		if (!row) return;
		push("control-edit", {
			ownerId,
			canonicalName: row.canonicalName,
		});
	}

	function openContextMenuIfEligible() {
		if (!focusedRow) return;
		if (focusedRow.isInherited || focusedRow.entryId === null) return;
		const items = isControllerContext ? ["Clear", "Delete"] : ["Clear"];
		setContextMenuItems(items);
		setOverlay("context-menu");
		setOverlayIndex(0);
	}

	function confirmClear() {
		if (!focusedRow?.entryId) return;
		const clearedName =
			focusedRow.controlName !== "—"
				? focusedRow.controlName
				: focusedRow.canonicalLabel;
		setStore((prev) => ({
			...prev,
			controls: {
				...prev.controls,
				controls: prev.controls.controls.map((c) =>
					c.id === focusedRow.entryId
						? { ...c, controlName: "", event: "" }
						: c,
				),
			},
		}));
		setStatusMessage(`${clearedName} cleared`);
	}

	function confirmDelete() {
		if (!focusedRow?.entryId) return;
		const deletedName =
			focusedRow.controlName !== "—"
				? focusedRow.controlName
				: focusedRow.canonicalLabel;
		setStore((prev) => ({
			...prev,
			controls: {
				...prev.controls,
				controls: prev.controls.controls.filter(
					(c) => c.id !== focusedRow.entryId,
				),
			},
		}));
		setOverlay(null);
		setStatusMessage(`${deletedName} deleted`);
	}

	function toggleFocusRegion() {
		if (focusRegion === "list") {
			setFocusRegion("topbar");
			backButtonRef.current?.focus();
		} else {
			setFocusRegion("list");
			containerRef.current?.focus();
		}
	}

	const derivedStatusMessage = deriveStatusMessage(
		focusedRow,
		statusMessage,
		isControllerContext,
		owner?.familyName,
	);

	const ownerLabel = owner?.name ?? ownerId;

	return (
		<div
			role="application"
			className="screen"
			ref={containerRef}
			tabIndex={-1}
			onContextMenu={(e) => {
				e.preventDefault();
				openContextMenuIfEligible();
			}}
		>
			<div className="screen__topbar">
				<span className="screen__topbar-title">{ownerLabel} Controls</span>
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
				<div className="list__header">
					<span className="control-list__header-control-name">Control</span>
					<span className="control-list__header-canonical-name">Canonical</span>
					<span className="control-list__header-event">Event</span>
					{isControllerContext && (
						<span className="control-list__header-source">Source</span>
					)}
				</div>
				<ul className="list">
					{rows.map((row, index) => (
						<li
							key={row.canonicalName}
							className={buildRowClassName(
								index === safeSelectedIndex && focusRegion === "list",
								row.isInherited,
							)}
							style={{ display: "flex", gap: "16px" }}
						>
							<span className="control-list__row-control-name">
								{row.controlName}
							</span>
							<span className="control-list__row-canonical-name">
								{row.canonicalLabel}
							</span>
							<span className="control-list__row-event">{row.event}</span>
							{isControllerContext && (
								<span className="control-list__row-source">
									{row.sourceLabel ?? "—"}
								</span>
							)}
						</li>
					))}
				</ul>
			</div>
			<div className="screen__bottombar">{derivedStatusMessage}</div>
			{overlay === "context-menu" && focusedRow && (
				<div
					className="overlay-backdrop"
					style={{ alignItems: "flex-start", paddingTop: "80px" }}
				>
					<div className="overlay">
						<ul className="overlay__list">
							{contextMenuItems.map((item, index) => (
								<li
									key={item}
									className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
								>
									{item}
								</li>
							))}
						</ul>
					</div>
				</div>
			)}
			{overlay === "delete" && focusedRow && (
				<div className="overlay-backdrop">
					<div className="overlay">
						<div className="overlay__title">
							Delete{" "}
							{focusedRow.controlName !== "—"
								? focusedRow.controlName
								: focusedRow.canonicalLabel}
							?
						</div>
						<ul className="overlay__list">
							{DELETE_OPTIONS.map((option, index) => (
								<li
									key={option}
									className={`overlay__row${index === overlayIndex ? " overlay__row--selected" : ""}`}
								>
									{option}
								</li>
							))}
						</ul>
					</div>
				</div>
			)}
		</div>
	);
}

function buildRowClassName(isSelected: boolean, isInherited: boolean): string {
	const parts = ["list__row"];
	if (isSelected) parts.push("list__row--selected");
	if (isInherited) parts.push("control-list__row--inherited");
	return parts.join(" ");
}

function deriveStatusMessage(
	focusedRow: ControlRow | undefined,
	statusMessage: string,
	isControllerContext: boolean,
	familyName: string | undefined,
): string {
	if (statusMessage) return statusMessage;
	if (isControllerContext && focusedRow?.isInherited && familyName) {
		return `Inherited from Family: ${familyName}. Select to override this mapping.`;
	}
	return "";
}
