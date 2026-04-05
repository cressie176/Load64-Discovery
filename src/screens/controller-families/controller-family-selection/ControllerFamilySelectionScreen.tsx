import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { ControllerFamily } from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";

interface ListItem {
	id: string | null;
	label: string;
}

function wrapIndex(index: number, delta: number, length: number): number {
	return (index + delta + length) % length;
}

function buildListItems(families: ControllerFamily[]): ListItem[] {
	const sorted = [...families].sort((a, b) => a.name.localeCompare(b.name));
	return [
		...sorted.map((f) => ({ id: f.id, label: f.name })),
		{ id: null, label: "None" },
	];
}

function resolveInitialIndex(
	items: ListItem[],
	currentFamilyId: string | null,
): number {
	const index = items.findIndex((item) => item.id === currentFamilyId);
	return index >= 0 ? index : items.length - 1;
}

interface ControllerFamilySelectionScreenProps {
	controllerId: string;
}

export function ControllerFamilySelectionScreen({
	controllerId,
}: ControllerFamilySelectionScreenProps) {
	const { pop } = useRouter();
	const { store, setStore } = useStore();

	const controller = store.controllerFamilies.controllers.find(
		(c) => c.id === controllerId,
	);
	const items = buildListItems(store.controllerFamilies.families);

	const [selectedIndex, setSelectedIndex] = useState(() =>
		resolveInitialIndex(items, controller?.familyId ?? null),
	);
	const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");

	const containerRef = useRef<HTMLDivElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		containerRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
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
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	});

	function handleTopBarKey(event: KeyboardEvent) {
		if (event.key === "Enter") {
			pop();
		}
	}

	function handleListKey(event: KeyboardEvent) {
		if (items.length === 0) return;
		if (event.key === "ArrowDown") {
			setSelectedIndex((prev) => wrapIndex(prev, 1, items.length));
		} else if (event.key === "ArrowUp") {
			setSelectedIndex((prev) => wrapIndex(prev, -1, items.length));
		} else if (event.key === "Enter") {
			confirmSelection();
		}
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

	function confirmSelection() {
		const selected = items[selectedIndex];
		if (!selected || !controllerId) return;
		const selectedFamily = selected.id
			? store.controllerFamilies.families.find((f) => f.id === selected.id)
			: null;
		setStore((prev) => ({
			...prev,
			controllerFamilies: {
				...prev.controllerFamilies,
				controllers: prev.controllerFamilies.controllers.map((c) =>
					c.id === controllerId ? { ...c, familyId: selected.id } : c,
				),
			},
			controllers: prev.controllers.map((c) =>
				c.id === controllerId
					? {
							...c,
							familyName: selectedFamily?.name ?? undefined,
						}
					: c,
			),
		}));
		pop();
	}

	return (
		<div className="screen" ref={containerRef} tabIndex={-1}>
			<div className="screen__topbar">
				<span className="screen__topbar-title">Select Controller Family</span>
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
				<ul className="list">
					{items.map((item, index) => (
						<li
							key={item.id ?? "none"}
							className={`list__row${index === selectedIndex && focusRegion === "list" ? " list__row--selected" : ""}`}
						>
							{item.label}
						</li>
					))}
				</ul>
			</div>
			<div className="screen__bottombar" />
		</div>
	);
}
