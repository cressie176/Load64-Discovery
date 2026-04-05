import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { CompilationDetailGame } from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";
type TopBarCta = "add" | "back";
type Overlay = "remove";

const TOP_BAR_CTAS: TopBarCta[] = ["add", "back"];
const REMOVE_OPTIONS = ["Yes", "No"] as const;

function wrapIndex(index: number, delta: number, length: number): number {
	return (index + delta + length) % length;
}

function sortGamesByTitle(
	games: CompilationDetailGame[],
): CompilationDetailGame[] {
	return [...games].sort((a, b) => a.sortTitle.localeCompare(b.sortTitle));
}

function getSectionKey(sortTitle: string): string {
	const first = sortTitle.charAt(0).toUpperCase();
	if (first >= "0" && first <= "9") return "0-9";
	if (first >= "A" && first <= "Z") return first;
	return "#";
}

function formatCount(count: number): string {
	return count === 1 ? "1 game" : `${count} games`;
}

interface CompilationDetailScreenProps {
	compilationId: string;
	statusMessage?: string;
}

export function CompilationDetailScreen({
	compilationId,
	statusMessage: initialStatusMessage = "",
}: CompilationDetailScreenProps) {
	const { pop, push } = useRouter();
	const { store, setStore } = useStore();

	const compilation = store.compilations.compilations.find(
		(c) => c.id === compilationId,
	);

	const allGames = store.carousel.games;
	const compilationRefs = store.compilations.compilationGameRefs;

	const gameIds =
		compilation?.kind === "all-games"
			? allGames.map((g) => g.id)
			: compilationRefs
					.filter((ref) => ref.compilationId === compilationId)
					.map((ref) => ref.gameId);

	const games: CompilationDetailGame[] = sortGamesByTitle(
		gameIds
			.map((id) => allGames.find((g) => g.id === id))
			.filter((g): g is NonNullable<typeof g> => g !== undefined)
			.map((g) => ({
				id: g.id,
				title: g.title,
				sortTitle: g.sortTitle,
				publisher: g.publisher || undefined,
				year: g.year || undefined,
			})),
	);

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
	const [focusedCta, setFocusedCta] = useState<TopBarCta>("add");
	const [overlay, setOverlay] = useState<Overlay | null>(null);
	const [overlayIndex, setOverlayIndex] = useState(0);
	const [statusMessage, setStatusMessage] = useState(initialStatusMessage);

	const containerRef = useRef<HTMLDivElement>(null);
	const addButtonRef = useRef<HTMLButtonElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);

	const safeSelectedIndex =
		games.length > 0 ? Math.min(selectedIndex, games.length - 1) : 0;
	const focusedGame = games[safeSelectedIndex];

	useEffect(() => {
		containerRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (overlay === "remove") {
				handleRemoveOverlayKey(event);
				return;
			}
			handleMainKey(event);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	});

	function handleRemoveOverlayKey(event: KeyboardEvent) {
		if (event.key === "ArrowDown") {
			setOverlayIndex((prev) => wrapIndex(prev, 1, REMOVE_OPTIONS.length));
		} else if (event.key === "ArrowUp") {
			setOverlayIndex((prev) => wrapIndex(prev, -1, REMOVE_OPTIONS.length));
		} else if (event.key === "Enter") {
			if (overlayIndex === 0) {
				confirmRemove();
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
		if (games.length === 0) return;
		if (event.key === "ArrowDown") {
			setSelectedIndex((prev) => wrapIndex(prev, 1, games.length));
			setStatusMessage("");
		} else if (event.key === "ArrowUp") {
			setSelectedIndex((prev) => wrapIndex(prev, -1, games.length));
			setStatusMessage("");
		} else if (event.key === "PageDown") {
			jumpToNextSection();
		} else if (event.key === "PageUp") {
			jumpToPrevSection();
		} else if (event.code === "AltLeft") {
			event.preventDefault();
			openRemoveOverlay();
		} else {
			const char = event.key.toUpperCase();
			if (/^[A-Z0-9]$/.test(char)) {
				jumpToSection(char);
			}
		}
	}

	function jumpToSection(char: string) {
		const target = char >= "0" && char <= "9" ? "0-9" : char;
		const idx = games.findIndex((g) => getSectionKey(g.sortTitle) === target);
		if (idx >= 0) {
			setSelectedIndex(idx);
			setStatusMessage("");
		}
	}

	function jumpToNextSection() {
		if (games.length === 0) return;
		const currentSection = getSectionKey(games[safeSelectedIndex].sortTitle);
		const idx = games.findIndex(
			(g, i) =>
				i > safeSelectedIndex && getSectionKey(g.sortTitle) !== currentSection,
		);
		if (idx >= 0) {
			setSelectedIndex(idx);
			setStatusMessage("");
		}
	}

	function jumpToPrevSection() {
		if (games.length === 0) return;
		const currentSection = getSectionKey(games[safeSelectedIndex].sortTitle);
		// find the start of the current section
		const currentSectionStart = games.findIndex(
			(g) => getSectionKey(g.sortTitle) === currentSection,
		);
		if (currentSectionStart > 0) {
			// go to start of previous section
			const prevSection = getSectionKey(
				games[currentSectionStart - 1].sortTitle,
			);
			const idx = games.findIndex(
				(g) => getSectionKey(g.sortTitle) === prevSection,
			);
			if (idx >= 0) {
				setSelectedIndex(idx);
				setStatusMessage("");
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
		push("compilation-membership", { compilationId });
	}

	function openRemoveOverlay() {
		if (!focusedGame) return;
		setOverlay("remove");
		setOverlayIndex(0);
	}

	function confirmRemove() {
		if (!focusedGame) return;
		const removedTitle = focusedGame.title;
		setStore((prev) => ({
			...prev,
			compilations: {
				...prev.compilations,
				compilationGameRefs: prev.compilations.compilationGameRefs.filter(
					(ref) =>
						!(
							ref.compilationId === compilationId &&
							ref.gameId === focusedGame.id
						),
				),
			},
		}));
		setOverlay(null);
		setStatusMessage(`${removedTitle} removed`);
		setSelectedIndex((prev) => Math.max(0, prev - 1));
	}

	const isEmpty = games.length === 0;

	return (
		<div
			role="application"
			className="screen"
			ref={containerRef}
			tabIndex={-1}
			onContextMenu={(e) => {
				e.preventDefault();
				openRemoveOverlay();
			}}
		>
			<div className="screen__topbar">
				<span className="screen__topbar-title">
					Compilations – {compilation?.name ?? "Compilation"}
				</span>
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
			<div
				className={`screen__content${isEmpty ? " screen__content--empty" : ""}`}
			>
				{isEmpty ? (
					<p>Select Add to add games to this compilation.</p>
				) : (
					<>
						<div className="list__header">
							<div className="compilation-detail__columns">
								<span>Title</span>
								<span>Publisher</span>
								<span style={{ textAlign: "right" }}>Year</span>
							</div>
						</div>
						<ul className="list">
							{games.map((game, index) => (
								<li
									key={game.id}
									className={`list__row${index === safeSelectedIndex && focusRegion === "list" ? " list__row--selected" : ""}`}
								>
									<div className="compilation-detail__columns">
										<span className="compilation-detail__row-title">
											{game.title}
										</span>
										<span className="compilation-detail__row-publisher">
											{game.publisher ?? "—"}
										</span>
										<span className="compilation-detail__row-year">
											{game.year ?? "—"}
										</span>
									</div>
								</li>
							))}
						</ul>
					</>
				)}
			</div>
			<div className="screen__bottombar">
				{statusMessage || formatCount(games.length)}
			</div>
			{overlay === "remove" && focusedGame && (
				<div className="overlay-backdrop">
					<div className="overlay">
						<div className="overlay__title">Remove {focusedGame.title}?</div>
						<ul className="overlay__list">
							{REMOVE_OPTIONS.map((option, index) => (
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
