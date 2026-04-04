import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { KeyMappingRow, KeyMappingsState } from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";
type TopBarCta = "add" | "back";
type Overlay = "delete";

const TOP_BAR_CTAS: TopBarCta[] = ["add", "back"];
const DELETE_OPTIONS = ["Yes", "No"] as const;
const CONTEXT_MENU_ITEMS = ["Delete"] as const;

function buildRows(ownerId: string, state: KeyMappingsState): KeyMappingRow[] {
	const owner = state.owners.find((o) => o.id === ownerId);
	if (!owner) return [];

	const ownedMappings = state.mappings.filter((m) => m.ownerId === ownerId);

	const inheritedRows: KeyMappingRow[] = owner.profileIds.flatMap(
		(profileId) => {
			const profile = state.owners.find((o) => o.id === profileId);
			return state.mappings
				.filter((m) => m.ownerId === profileId)
				.map((m) => ({
					id: m.id,
					hostKey: m.hostKey,
					machineKey: m.machineKey,
					sourceLabel: `Profile: ${profile?.name ?? profileId}`,
					isInherited: true,
					ownerId: m.ownerId,
				}));
		},
	);

	const ownedRows: KeyMappingRow[] = ownedMappings.map((m) => ({
		id: m.id,
		hostKey: m.hostKey,
		machineKey: m.machineKey,
		sourceLabel: "—",
		isInherited: false,
		ownerId: m.ownerId,
	}));

	return [...ownedRows, ...inheritedRows].sort((a, b) =>
		a.hostKey.localeCompare(b.hostKey),
	);
}

function wrapIndex(index: number, delta: number, length: number): number {
	return (index + delta + length) % length;
}

interface KeyMappingListScreenProps {
	ownerId: string;
	statusMessage?: string;
}

export function KeyMappingListScreen({
	ownerId,
	statusMessage: initialStatusMessage = "",
}: KeyMappingListScreenProps) {
	const { pop, push } = useRouter();
	const { store, setStore } = useStore();

	const rows = buildRows(ownerId, store.keyMappings);
	const owner = store.keyMappings.owners.find((o) => o.id === ownerId);

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
	const [focusedCta, setFocusedCta] = useState<TopBarCta>("add");
	const [overlay, setOverlay] = useState<Overlay | null>(null);
	const [overlayIndex, setOverlayIndex] = useState(0);
	const [showContextMenu, setShowContextMenu] = useState(false);
	const [contextMenuIndex, setContextMenuIndex] = useState(0);
	const [statusMessage, setStatusMessage] = useState(initialStatusMessage);

	const containerRef = useRef<HTMLDivElement>(null);
	const addButtonRef = useRef<HTMLButtonElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);

	const safeSelectedIndex =
		rows.length > 0 ? Math.min(selectedIndex, rows.length - 1) : 0;
	const focusedRow = rows[safeSelectedIndex];

	useEffect(() => {
		containerRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (overlay === "delete") {
				handleDeleteOverlayKey(event);
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

	function handleContextMenuKey(event: KeyboardEvent) {
		if (event.key === "ArrowDown") {
			setContextMenuIndex((prev) =>
				wrapIndex(prev, 1, CONTEXT_MENU_ITEMS.length),
			);
		} else if (event.key === "ArrowUp") {
			setContextMenuIndex((prev) =>
				wrapIndex(prev, -1, CONTEXT_MENU_ITEMS.length),
			);
		} else if (event.key === "Enter") {
			if (CONTEXT_MENU_ITEMS[contextMenuIndex] === "Delete") {
				setShowContextMenu(false);
				openDeleteOverlay();
			}
		} else if (event.key === "Escape") {
			setShowContextMenu(false);
		}
	}

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
		if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
			const delta = event.key === "ArrowLeft" ? -1 : 1;
			const currentIndex = TOP_BAR_CTAS.indexOf(focusedCta);
			const nextIndex = wrapIndex(currentIndex, delta, TOP_BAR_CTAS.length);
			const nextCta = TOP_BAR_CTAS[nextIndex] as TopBarCta;
			setFocusedCta(nextCta);
			focusCtaButton(nextCta);
		} else if (event.key === "Enter") {
			if (focusedCta === "add") {
				navigateToAdd();
			} else {
				pop();
			}
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
			openContextMenu();
		}
	}

	function activateRow(row: KeyMappingRow | undefined) {
		if (!row) return;
		push("key-mapping-edit", { ownerId, keyMappingId: row.id });
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
		if (cta === "add") {
			addButtonRef.current?.focus();
		} else {
			backButtonRef.current?.focus();
		}
	}

	function navigateToAdd() {
		push("key-mapping-edit", { ownerId });
	}

	function openContextMenu() {
		if (focusedRow?.isInherited) return;
		setContextMenuIndex(0);
		setShowContextMenu(true);
	}

	function openDeleteOverlay() {
		setOverlay("delete");
		setOverlayIndex(0);
	}

	function confirmDelete() {
		if (!focusedRow) return;
		const deletedKey = focusedRow.hostKey;
		setStore((prev) => ({
			...prev,
			keyMappings: {
				...prev.keyMappings,
				mappings: prev.keyMappings.mappings.filter(
					(m) => m.id !== focusedRow.id,
				),
			},
		}));
		setOverlay(null);
		setStatusMessage(`${deletedKey} mapping deleted`);
		setSelectedIndex((prev) => Math.max(0, prev - 1));
	}

	const derivedStatusMessage = deriveStatusMessage(
		focusedRow,
		statusMessage,
		rows.length,
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
				openContextMenu();
			}}
		>
			<div className="screen__topbar">
				<span className="screen__topbar-title">{ownerLabel} Key Mappings</span>
				<div className="screen__topbar-ctas">
					<button
						ref={addButtonRef}
						className={`topbar-cta${focusRegion === "topbar" && focusedCta === "add" ? " topbar-cta--focused" : ""}`}
						onClick={navigateToAdd}
						type="button"
					>
						[Add]
					</button>
					<button
						ref={backButtonRef}
						className={`topbar-cta${focusRegion === "topbar" && focusedCta === "back" ? " topbar-cta--focused" : ""}`}
						onClick={pop}
						type="button"
					>
						[Back]
					</button>
				</div>
			</div>
			<div className="screen__content">
				{rows.length === 0 ? (
					<p>Select Add to add a key mapping.</p>
				) : (
					<ul className="list">
						{rows.map((row, index) => (
							<li
								key={row.id}
								className={buildRowClassName(
									index === safeSelectedIndex && focusRegion === "list",
									row.isInherited,
								)}
								style={{ display: "flex", gap: "16px" }}
							>
								<span className="key-mapping-list__row-host-key">
									{row.hostKey}
								</span>
								<span className="key-mapping-list__row-machine-key">
									{row.machineKey}
								</span>
								<span className="key-mapping-list__row-source">
									{row.sourceLabel}
								</span>
							</li>
						))}
					</ul>
				)}
			</div>
			<div className="screen__bottombar">{derivedStatusMessage}</div>
			{overlay === "delete" && focusedRow && (
				<div className="overlay-backdrop">
					<div className="overlay">
						<div className="overlay__title">
							Delete {focusedRow.hostKey} mapping?
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
			{showContextMenu && focusedRow && !focusedRow.isInherited && (
				<div
					className="overlay-backdrop"
					style={{ alignItems: "flex-start", paddingTop: "80px" }}
				>
					<div className="overlay">
						<ul className="overlay__list">
							{CONTEXT_MENU_ITEMS.map((item, index) => (
								<li
									key={item}
									className={`overlay__row${index === contextMenuIndex ? " overlay__row--selected" : ""}`}
								>
									{item}
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
	if (isInherited) parts.push("key-mapping-list__row--inherited");
	return parts.join(" ");
}

function deriveStatusMessage(
	focusedRow: KeyMappingRow | undefined,
	statusMessage: string,
	rowCount: number,
): string {
	if (statusMessage) return statusMessage;
	if (rowCount > 0 && focusedRow?.isInherited) {
		return `Inherited from ${focusedRow.sourceLabel}. Select to override this mapping.`;
	}
	return "";
}
