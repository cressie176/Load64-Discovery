import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { Controller } from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";
type Overlay = "delete";

const DELETE_OPTIONS = ["Yes", "No"] as const;

function buildDisplayName(controller: Controller): string {
	if (controller.connectedCount > 1) {
		return `${controller.name} (${controller.connectedCount})`;
	}
	return controller.name;
}

function buildStatusLabel(controller: Controller): string {
	if (controller.status === "not-configured") return "Not configured";
	if (controller.status === "connected") return "Connected";
	return "Disconnected";
}

function isSelectable(controller: Controller): boolean {
	return controller.status !== "disconnected";
}

function isConfigured(controller: Controller): boolean {
	return (
		controller.status === "connected" || controller.status === "disconnected"
	);
}

function sortControllers(controllers: Controller[]): Controller[] {
	const unconfigured = controllers
		.filter((c) => c.status === "not-configured")
		.sort((a, b) => a.name.localeCompare(b.name));
	const configured = controllers
		.filter((c) => c.status !== "not-configured")
		.sort((a, b) => a.name.localeCompare(b.name));
	return [...unconfigured, ...configured];
}

function deleteController(controllers: Controller[], id: string): Controller[] {
	return controllers.filter((c) => c.id !== id);
}

function wrapIndex(index: number, delta: number, length: number): number {
	return (index + delta + length) % length;
}

export function ControllerListScreen() {
	const { pop, push } = useRouter();
	const { store, setStore } = useStore();

	const controllers = sortControllers(store.controllers);

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
	const [overlay, setOverlay] = useState<Overlay | null>(null);
	const [overlayIndex, setOverlayIndex] = useState(0);
	const [statusMessage, setStatusMessage] = useState("");

	const containerRef = useRef<HTMLDivElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);

	const safeSelectedIndex =
		controllers.length > 0
			? Math.min(selectedIndex, controllers.length - 1)
			: 0;
	const focusedController = controllers[safeSelectedIndex];

	useEffect(() => {
		containerRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (overlay === "delete") {
				handleDeleteOverlayKey(event);
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
				closeDeleteOverlay();
			}
		} else if (event.key === "Escape") {
			closeDeleteOverlay();
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
			handleTopbarKey(event);
			return;
		}
		handleListKey(event);
	}

	function handleTopbarKey(event: KeyboardEvent) {
		if (event.key === "Enter") {
			pop();
		}
	}

	function handleListKey(event: KeyboardEvent) {
		if (controllers.length === 0) return;
		if (event.key === "ArrowDown") {
			setSelectedIndex((prev) => wrapIndex(prev, 1, controllers.length));
			setStatusMessage("");
		} else if (event.key === "ArrowUp") {
			setSelectedIndex((prev) => wrapIndex(prev, -1, controllers.length));
			setStatusMessage("");
		} else if (event.key === "Enter") {
			activateSelected();
		} else if (event.key === "Alt") {
			event.preventDefault();
			openDeleteForFocused();
		}
	}

	function toggleFocusRegion(reverse: boolean) {
		if (focusRegion === "list") {
			setFocusRegion("topbar");
			if (!reverse) {
				backButtonRef.current?.focus();
			} else {
				backButtonRef.current?.focus();
			}
		} else {
			setFocusRegion("list");
			containerRef.current?.focus();
		}
	}

	function activateSelected() {
		if (!focusedController) return;
		if (!isSelectable(focusedController)) return;
		push("controller-detail", { controllerId: focusedController.id });
	}

	function openDeleteForFocused() {
		if (!focusedController) return;
		if (!isConfigured(focusedController)) return;
		setOverlay("delete");
		setOverlayIndex(0);
	}

	function closeDeleteOverlay() {
		setOverlay(null);
		containerRef.current?.focus();
	}

	function confirmDelete() {
		if (!focusedController) return;
		const deletedName = buildDisplayName(focusedController);
		setStore((prev) => ({
			...prev,
			controllers: deleteController(prev.controllers, focusedController.id),
		}));
		setOverlay(null);
		setStatusMessage(`${deletedName} deleted`);
		setSelectedIndex((prev) => Math.max(0, prev - 1));
	}

	return (
		<div className="screen" ref={containerRef} tabIndex={-1}>
			<div className="screen__topbar">
				<span className="screen__topbar-title">Controllers</span>
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
				{controllers.length === 0 ? (
					<p>Connect any controllers you want to configure.</p>
				) : (
					<>
						<div className="list__header">
							<div className="controller-list__header">
								<span>Device</span>
								<span>Status</span>
							</div>
						</div>
						<ul className="list">
							{controllers.map((controller, index) => (
								<li
									key={controller.id}
									className={[
										"list__row",
										index === safeSelectedIndex && focusRegion === "list"
											? "list__row--selected"
											: "",
										!isSelectable(controller) ? "list__row--disabled" : "",
									]
										.filter(Boolean)
										.join(" ")}
								>
									<div className="controller-list__row">
										<span className="controller-list__name">
											{buildDisplayName(controller)}
										</span>
										<span
											className={[
												"controller-list__status",
												controller.status === "connected"
													? "controller-list__status--connected"
													: "",
												controller.status === "disconnected"
													? "controller-list__status--disconnected"
													: "",
											]
												.filter(Boolean)
												.join(" ")}
										>
											{buildStatusLabel(controller)}
										</span>
									</div>
								</li>
							))}
						</ul>
					</>
				)}
			</div>
			<div className="screen__bottombar">{statusMessage}</div>
			{overlay === "delete" && focusedController && (
				<div className="overlay-backdrop">
					<div className="overlay">
						<div className="overlay__title">
							Delete {buildDisplayName(focusedController)}?
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
