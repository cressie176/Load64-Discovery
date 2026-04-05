import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { Controller } from "../controller-list/types";
import "./index.css";

type FocusRegion = "list" | "actions" | "topbar";
type ActionField = "save" | "cancel";

const ACTION_FIELDS: ActionField[] = ["save", "cancel"];

function sortConfiguredControllers(controllers: Controller[]): Controller[] {
	return [...controllers]
		.filter((c) => c.status !== "not-configured")
		.sort((a, b) => a.name.localeCompare(b.name));
}

function buildPendingSet(
	controllers: Controller[],
	assignedIds: Set<string>,
): Set<string> {
	const pending = new Set<string>();
	for (const c of controllers) {
		if (assignedIds.has(c.id)) {
			pending.add(c.id);
		}
	}
	return pending;
}

function toggleEntry(pending: Set<string>, id: string): Set<string> {
	const next = new Set(pending);
	if (next.has(id)) {
		next.delete(id);
	} else {
		next.add(id);
	}
	return next;
}

function wrapIndex(index: number, delta: number, length: number): number {
	return (index + delta + length) % length;
}

interface ControllerSelectionScreenProps {
	profileId: string;
	ownerName?: string;
}

export function ControllerSelectionScreen({
	profileId,
	ownerName,
}: ControllerSelectionScreenProps) {
	const { pop } = useRouter();
	const { store, setStore } = useStore();

	const profile = store.profiles.profiles.find((p) => p.id === profileId);
	const resolvedOwnerName = ownerName ?? profile?.name ?? profileId;

	const controllers = sortConfiguredControllers(store.controllers);

	const assignedIds = new Set(
		store.profileDetail.controllerRefs
			.filter((r) => r.profileId === profileId)
			.map((r) => r.controllerId),
	);

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [pending, setPending] = useState<Set<string>>(() =>
		buildPendingSet(controllers, assignedIds),
	);
	const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
	const [activeAction, setActiveAction] = useState<ActionField>("save");

	const containerRef = useRef<HTMLDivElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);
	const saveButtonRef = useRef<HTMLButtonElement>(null);
	const cancelButtonRef = useRef<HTMLButtonElement>(null);

	const hasControllers = controllers.length > 0;

	useEffect(() => {
		containerRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			handleMainKey(event);
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	});

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
		if (focusRegion === "actions") {
			handleActionsKey(event);
			return;
		}
		handleListKey(event);
	}

	function handleTopBarKey(event: KeyboardEvent) {
		if (event.key === "Enter") {
			pop();
		}
	}

	function handleActionsKey(event: KeyboardEvent) {
		if (event.key === "ArrowRight" || event.key === "ArrowDown") {
			event.preventDefault();
			moveAction(1);
		} else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
			event.preventDefault();
			moveAction(-1);
		} else if (event.key === "Enter") {
			if (activeAction === "save") {
				handleSave();
			} else {
				pop();
			}
		}
	}

	function handleListKey(event: KeyboardEvent) {
		if (controllers.length === 0) return;
		if (event.key === "ArrowDown") {
			setSelectedIndex((prev) => wrapIndex(prev, 1, controllers.length));
		} else if (event.key === "ArrowUp") {
			setSelectedIndex((prev) => wrapIndex(prev, -1, controllers.length));
		} else if (event.key === "Enter") {
			const controller = controllers[selectedIndex];
			if (controller) {
				setPending((prev) => toggleEntry(prev, controller.id));
			}
		}
	}

	function toggleFocusRegion(reverse: boolean) {
		if (focusRegion === "list") {
			if (!hasControllers) {
				setFocusRegion("topbar");
				backButtonRef.current?.focus();
			} else if (reverse) {
				setFocusRegion("topbar");
				// no topbar CTAs when controllers exist; wrap to actions last
				focusAction("cancel");
			} else {
				setFocusRegion("actions");
				focusAction("save");
			}
		} else if (focusRegion === "actions") {
			if (reverse) {
				setFocusRegion("list");
				containerRef.current?.focus();
			} else {
				if (!hasControllers) {
					setFocusRegion("topbar");
					backButtonRef.current?.focus();
				} else {
					// no topbar CTAs; wrap back to list
					setFocusRegion("list");
					containerRef.current?.focus();
				}
			}
		} else {
			// topbar
			if (reverse) {
				if (hasControllers) {
					setFocusRegion("actions");
					focusAction("cancel");
				} else {
					setFocusRegion("list");
					containerRef.current?.focus();
				}
			} else {
				setFocusRegion("list");
				containerRef.current?.focus();
			}
		}
	}

	function focusAction(action: ActionField) {
		setActiveAction(action);
		setFocusRegion("actions");
		if (action === "save") {
			saveButtonRef.current?.focus();
		} else {
			cancelButtonRef.current?.focus();
		}
	}

	function moveAction(delta: number) {
		const currentIndex = ACTION_FIELDS.indexOf(activeAction);
		const nextIndex =
			(currentIndex + delta + ACTION_FIELDS.length) % ACTION_FIELDS.length;
		focusAction(ACTION_FIELDS[nextIndex] as ActionField);
	}

	function handleSave() {
		const otherRefs = store.profileDetail.controllerRefs.filter(
			(r) => r.profileId !== profileId,
		);
		const newRefs = Array.from(pending).map((controllerId) => ({
			profileId,
			controllerId,
		}));
		setStore((prev) => ({
			...prev,
			profileDetail: {
				...prev.profileDetail,
				controllerRefs: [...otherRefs, ...newRefs],
			},
		}));
		pop();
	}

	const title = `${resolvedOwnerName} Controllers`;

	return (
		<div className="screen" ref={containerRef} tabIndex={-1}>
			<div className="screen__topbar">
				<span className="screen__topbar-title">{title}</span>
				{!hasControllers && (
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
				)}
			</div>
			<div className="screen__content">
				{!hasControllers ? (
					<p className="screen__content--empty">
						No controllers configured. Add controllers from the Admin Hub.
					</p>
				) : (
					<>
						<ul className="list controller-selection__list">
							{controllers.map((controller, index) => {
								const isSelected =
									index === selectedIndex && focusRegion === "list";
								const isChecked = pending.has(controller.id);
								return (
									<li
										key={controller.id}
										className={`list__row${isSelected ? " list__row--selected" : ""}`}
									>
										<span className="controller-selection__checkbox">
											{isChecked ? "[x]" : "[ ]"}
										</span>
										<span className="controller-selection__name">
											{controller.name}
										</span>
									</li>
								);
							})}
						</ul>
						<div className="controller-selection__actions">
							<button
								ref={saveButtonRef}
								className={`form__action${activeAction === "save" && focusRegion === "actions" ? " form__action--active" : ""}`}
								onClick={handleSave}
								onFocus={() => {
									setActiveAction("save");
									setFocusRegion("actions");
								}}
								type="button"
							>
								[Save]
							</button>
							<button
								ref={cancelButtonRef}
								className={`form__action${activeAction === "cancel" && focusRegion === "actions" ? " form__action--active" : ""}`}
								onClick={pop}
								onFocus={() => {
									setActiveAction("cancel");
									setFocusRegion("actions");
								}}
								type="button"
							>
								[Cancel]
							</button>
						</div>
					</>
				)}
			</div>
			<div className="screen__bottombar" />
		</div>
	);
}
