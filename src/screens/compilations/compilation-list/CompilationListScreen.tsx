import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { Compilation } from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";
type TopBarCta = "add" | "back";
type Overlay = "delete";

const ADMIN_TOP_BAR_CTAS: TopBarCta[] = ["add", "back"];
const BROWSE_TOP_BAR_CTAS: TopBarCta[] = ["back"];
const DELETE_OPTIONS = ["Yes", "No"] as const;

function wrapIndex(index: number, delta: number, length: number): number {
	return (index + delta + length) % length;
}

function sortCompilationsForAdmin(compilations: Compilation[]): Compilation[] {
	const untested = compilations.filter((c) => c.kind === "untested");
	const userDefined = compilations
		.filter((c) => c.kind === "user-defined")
		.sort((a, b) => a.name.localeCompare(b.name));
	return [...untested, ...userDefined];
}

function sortCompilationsForBrowse(compilations: Compilation[]): Compilation[] {
	const allGames = compilations.filter((c) => c.kind === "all-games");
	const untested = compilations.filter((c) => c.kind === "untested");
	const userDefined = compilations
		.filter((c) => c.kind === "user-defined")
		.sort((a, b) => a.name.localeCompare(b.name));
	return [...allGames, ...untested, ...userDefined];
}

function deleteCompilation(
	compilations: Compilation[],
	compilationId: string,
): Compilation[] {
	return compilations.filter((c) => c.id !== compilationId);
}

interface CompilationListScreenProps {
	mode: "admin" | "browse";
	statusMessage?: string;
}

export function CompilationListScreen({
	mode,
	statusMessage: initialStatusMessage = "",
}: CompilationListScreenProps) {
	const { pop, push } = useRouter();
	const { store, setStore } = useStore();

	const allCompilations = store.compilations.compilations;
	const compilations =
		mode === "admin"
			? sortCompilationsForAdmin(allCompilations)
			: sortCompilationsForBrowse(allCompilations);

	const topBarCtas =
		mode === "admin" ? ADMIN_TOP_BAR_CTAS : BROWSE_TOP_BAR_CTAS;

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
		compilations.length > 0
			? Math.min(selectedIndex, compilations.length - 1)
			: 0;
	const focusedCompilation = compilations[safeSelectedIndex];

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
		if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
			const delta = event.key === "ArrowLeft" ? -1 : 1;
			const currentIndex = topBarCtas.indexOf(focusedCta);
			const nextIndex = wrapIndex(currentIndex, delta, topBarCtas.length);
			const nextCta = topBarCtas[nextIndex] as TopBarCta;
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
		if (compilations.length === 0) return;
		if (event.key === "ArrowDown") {
			setSelectedIndex((prev) => wrapIndex(prev, 1, compilations.length));
			setStatusMessage("");
		} else if (event.key === "ArrowUp") {
			setSelectedIndex((prev) => wrapIndex(prev, -1, compilations.length));
			setStatusMessage("");
		} else if (event.key === "Enter") {
			activateCompilation();
		}
	}

	function activateCompilation() {
		if (!focusedCompilation) return;
		if (mode === "browse") {
			push("carousel", { compilationId: focusedCompilation.id });
		} else {
			push("compilation-detail", { compilationId: focusedCompilation.id });
		}
	}

	function toggleFocusRegion() {
		if (focusRegion === "list") {
			setFocusRegion("topbar");
			const firstCta = topBarCtas[0] as TopBarCta;
			setFocusedCta(firstCta);
			focusCtaButton(firstCta);
		} else {
			setFocusRegion("list");
			containerRef.current?.focus();
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
		push("compilation-edit");
	}

	function navigateToRename() {
		if (!focusedCompilation) return;
		push("compilation-edit", { compilationId: focusedCompilation.id });
	}

	function openDeleteOverlay() {
		setOverlay("delete");
		setOverlayIndex(0);
	}

	function confirmDelete() {
		if (!focusedCompilation) return;
		const deletedName = focusedCompilation.name;
		setStore((prev) => ({
			...prev,
			compilations: {
				...prev.compilations,
				compilations: deleteCompilation(
					prev.compilations.compilations,
					focusedCompilation.id,
				),
			},
		}));
		setOverlay(null);
		setStatusMessage(`${deletedName} deleted`);
		setSelectedIndex((prev) => Math.max(0, prev - 1));
	}

	function countGames(compilationId: string): number {
		return store.compilations.compilationGameRefs.filter(
			(ref) => ref.compilationId === compilationId,
		).length;
	}

	function formatGameCount(count: number): string {
		return count === 1 ? "1 game" : `${count} games`;
	}

	function deleteWarningMessage(compilation: Compilation | undefined): string {
		if (!compilation) return "";
		const count = countGames(compilation.id);
		if (count === 0) return "";
		return `${compilation.name} contains ${count} game(s). Deleting it will not remove the games from your library.`;
	}

	const canShowContextMenu =
		mode === "admin" &&
		focusedCompilation !== undefined &&
		focusedCompilation.kind === "user-defined";

	const CONTEXT_MENU_ITEMS = ["Rename", "Delete"] as const;
	const warningMessage = deleteWarningMessage(focusedCompilation);

	return (
		<div className="screen" ref={containerRef} tabIndex={-1}>
			<div className="screen__topbar">
				<span className="screen__topbar-title">Compilations</span>
				<div className="screen__topbar-ctas">
					{mode === "admin" && (
						<button
							ref={addButtonRef}
							className={`topbar-cta${focusRegion === "topbar" && focusedCta === "add" ? " topbar-cta--focused" : ""}`}
							onClick={navigateToAdd}
							type="button"
						>
							[Add]
						</button>
					)}
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
				<ul className="list">
					{compilations.map((compilation, index) => (
						<li
							key={compilation.id}
							className={`list__row${index === safeSelectedIndex && focusRegion === "list" ? " list__row--selected" : ""}`}
							style={{ display: "flex", gap: "16px" }}
						>
							<span className="compilation-list__row-name">
								{compilation.name}
							</span>
							<span className="compilation-list__row-count">
								{formatGameCount(countGames(compilation.id))}
							</span>
						</li>
					))}
				</ul>
			</div>
			<div className="screen__bottombar">{statusMessage}</div>
			{overlay === "delete" && focusedCompilation && (
				<div className="overlay-backdrop">
					<div className="overlay">
						<div className="overlay__title">
							Delete {focusedCompilation.name}?
						</div>
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
			{showContextMenu && canShowContextMenu && focusedCompilation && (
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
