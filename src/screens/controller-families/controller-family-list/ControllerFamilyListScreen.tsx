import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { ControllerFamily } from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";
type TopBarCta = "add" | "back";
type Overlay = "delete";

const TOP_BAR_CTAS: TopBarCta[] = ["add", "back"];
const CONTEXT_MENU_ITEMS = ["Rename", "Delete"] as const;
const DELETE_OPTIONS = ["Yes", "No"] as const;

function wrapIndex(index: number, delta: number, length: number): number {
	return (index + delta + length) % length;
}

function sortFamilies(families: ControllerFamily[]): ControllerFamily[] {
	return [...families].sort((a, b) => a.name.localeCompare(b.name));
}

function deleteFamily(
	families: ControllerFamily[],
	familyId: string,
): ControllerFamily[] {
	return families.filter((f) => f.id !== familyId);
}

interface ControllerFamilyListScreenProps {
	statusMessage?: string;
}

export function ControllerFamilyListScreen({
	statusMessage: initialStatusMessage = "",
}: ControllerFamilyListScreenProps) {
	const { pop, push } = useRouter();
	const { store, setStore } = useStore();

	const families = sortFamilies(store.controllerFamilies.families);

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
		families.length > 0 ? Math.min(selectedIndex, families.length - 1) : 0;
	const focusedFamily = families[safeSelectedIndex];

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
			const action = CONTEXT_MENU_ITEMS[contextMenuIndex];
			setShowContextMenu(false);
			if (action === "Rename") {
				navigateToRename();
			} else if (action === "Delete") {
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

	function handleListKey(event: KeyboardEvent) {
		if (families.length === 0) return;
		if (event.key === "ArrowDown") {
			setSelectedIndex((prev) => wrapIndex(prev, 1, families.length));
			setStatusMessage("");
		} else if (event.key === "ArrowUp") {
			setSelectedIndex((prev) => wrapIndex(prev, -1, families.length));
			setStatusMessage("");
		} else if (event.key === "Enter") {
			if (focusedFamily) {
				push("control-list", { ownerId: focusedFamily.id });
			}
		} else if (event.code === "AltLeft") {
			event.preventDefault();
			openContextMenu();
		}
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
		push("controller-family-edit");
	}

	function navigateToRename() {
		if (!focusedFamily) return;
		push("controller-family-edit", { familyId: focusedFamily.id });
	}

	function openContextMenu() {
		setShowContextMenu(true);
		setContextMenuIndex(0);
	}

	function openDeleteOverlay() {
		setOverlay("delete");
		setOverlayIndex(0);
	}

	function confirmDelete() {
		if (!focusedFamily) return;
		const deletedName = focusedFamily.name;
		setStore((prev) => ({
			...prev,
			controllerFamilies: {
				...prev.controllerFamilies,
				families: deleteFamily(
					prev.controllerFamilies.families,
					focusedFamily.id,
				),
				controllers: prev.controllerFamilies.controllers.map((c) =>
					c.familyId === focusedFamily.id ? { ...c, familyId: null } : c,
				),
			},
		}));
		setOverlay(null);
		setStatusMessage(`${deletedName} deleted`);
		setSelectedIndex((prev) => Math.max(0, prev - 1));
	}

	function controllerCount(familyId: string): number {
		return store.controllerFamilies.controllers.filter(
			(c) => c.familyId === familyId,
		).length;
	}

	function deleteWarningMessage(family: ControllerFamily | undefined): string {
		if (!family) return "";
		const count = controllerCount(family.id);
		if (count === 0) return "";
		return `${family.name} is used by ${count} controller(s). Deleting it will remove their family reference.`;
	}

	const warningMessage = deleteWarningMessage(focusedFamily);

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
				<span className="screen__topbar-title">Controller Families</span>
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
				{families.length === 0 ? (
					<p>Select Add to create a controller family.</p>
				) : (
					<ul className="list">
						{families.map((family, index) => (
							<li
								key={family.id}
								className={`list__row${index === safeSelectedIndex && focusRegion === "list" ? " list__row--selected" : ""}`}
							>
								{family.name}
							</li>
						))}
					</ul>
				)}
			</div>
			<div className="screen__bottombar">{statusMessage}</div>
			{overlay === "delete" && focusedFamily && (
				<div className="overlay-backdrop">
					<div className="overlay">
						<div className="overlay__title">Delete {focusedFamily.name}?</div>
						{warningMessage && (
							<p
								style={{
									color: "var(--colour-text-muted)",
									fontSize: "12px",
									marginBottom: "12px",
								}}
							>
								{warningMessage}
							</p>
						)}
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
			{showContextMenu && focusedFamily && (
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
