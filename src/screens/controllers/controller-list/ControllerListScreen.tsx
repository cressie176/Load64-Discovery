import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { Controller } from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";
type Overlay = "context-menu" | "clear" | "delete";

const CONFIRM_OPTIONS = ["Yes", "No"] as const;

function isSelectable(controller: Controller): boolean {
	return controller.connectedCount > 0;
}

function isConfigured(controller: Controller): boolean {
	return (
		controller.status === "connected" || controller.status === "disconnected"
	);
}

function canClear(controller: Controller): boolean {
	return isConfigured(controller);
}

function canDelete(controller: Controller): boolean {
	return (
		controller.status === "disconnected" ||
		controller.status === "disconnected-unconfigured"
	);
}

function sortControllers(controllers: Controller[]): Controller[] {
	const connected = controllers
		.filter((c) => c.connectedCount > 0)
		.sort((a, b) => a.name.localeCompare(b.name));
	const disconnected = controllers
		.filter((c) => c.connectedCount === 0)
		.sort((a, b) => a.name.localeCompare(b.name));
	return [...connected, ...disconnected];
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
	const [contextMenuItems, setContextMenuItems] = useState<string[]>([]);
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
			if (overlay === "context-menu") {
				handleContextMenuKey(event);
				return;
			}
			if (overlay === "clear") {
				handleConfirmOverlayKey(event, confirmClear, () => setOverlay(null));
				return;
			}
			if (overlay === "delete") {
				handleConfirmOverlayKey(event, confirmDelete, () => setOverlay(null));
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
			if (action === "Clear") {
				setOverlay("clear");
				setOverlayIndex(0);
			} else if (action === "Delete") {
				setOverlay("delete");
				setOverlayIndex(0);
			}
		} else if (event.key === "Escape") {
			setOverlay(null);
		}
	}

	function handleConfirmOverlayKey(
		event: KeyboardEvent,
		onConfirm: () => void,
		onCancel: () => void,
	) {
		if (event.key === "ArrowDown") {
			setOverlayIndex((prev) => wrapIndex(prev, 1, CONFIRM_OPTIONS.length));
		} else if (event.key === "ArrowUp") {
			setOverlayIndex((prev) => wrapIndex(prev, -1, CONFIRM_OPTIONS.length));
		} else if (event.key === "Enter") {
			if (overlayIndex === 0) {
				onConfirm();
			} else {
				onCancel();
			}
		} else if (event.key === "Escape") {
			onCancel();
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
			openContextMenuForFocused();
		}
	}

	function toggleFocusRegion(_reverse: boolean) {
		if (focusRegion === "list") {
			setFocusRegion("topbar");
			backButtonRef.current?.focus();
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

	function openContextMenuForFocused() {
		if (!focusedController) return;
		const items: string[] = [];
		if (canClear(focusedController)) items.push("Clear");
		if (canDelete(focusedController)) items.push("Delete");
		if (items.length === 0) return;
		setContextMenuItems(items);
		setOverlay("context-menu");
		setOverlayIndex(0);
	}

	function confirmClear() {
		if (!focusedController) return;
		const { name, deviceCount, status } = focusedController;
		const clearedStatus =
			status === "disconnected"
				? ("disconnected-unconfigured" as const)
				: ("not-configured" as const);
		setStore((prev) => ({
			...prev,
			controllers: prev.controllers.map((c) =>
				c.id === focusedController.id ? { ...c, status: clearedStatus } : c,
			),
			controls: {
				...prev.controls,
				owners: prev.controls.owners.filter(
					(o) => o.id !== focusedController.id,
				),
				controls: prev.controls.controls.filter(
					(c) => c.ownerId !== focusedController.id,
				),
			},
		}));
		setOverlay(null);
		setStatusMessage(
			deviceCount > 1
				? `${name} cleared (${deviceCount} devices affected)`
				: `${name} cleared`,
		);
	}

	function confirmDelete() {
		if (!focusedController) return;
		const { name } = focusedController;
		setStore((prev) => ({
			...prev,
			controllers: deleteController(prev.controllers, focusedController.id),
			controls: {
				...prev.controls,
				owners: prev.controls.owners.filter(
					(o) => o.id !== focusedController.id,
				),
				controls: prev.controls.controls.filter(
					(c) => c.ownerId !== focusedController.id,
				),
			},
		}));
		setOverlay(null);
		setStatusMessage(`${name} deleted`);
		setSelectedIndex((prev) => Math.max(0, prev - 1));
	}

	return (
		<div
			role="application"
			className="screen"
			ref={containerRef}
			tabIndex={-1}
			onContextMenu={(e) => {
				e.preventDefault();
				openContextMenuForFocused();
			}}
		>
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
								<span>Family</span>
								<span className="controller-list__count">Count</span>
								<span className="controller-list__count">Connected</span>
								<span>Configured</span>
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
											{controller.name}
										</span>
										<span className="controller-list__family">
											{controller.familyName ?? "—"}
										</span>
										<span className="controller-list__count">
											{controller.deviceCount}
										</span>
										<span
											className={`controller-list__count${controller.connectedCount > 0 ? " controller-list__connected--yes" : " controller-list__connected--no"}`}
										>
											{controller.connectedCount}
										</span>
										<span
											className={`controller-list__configured${isConfigured(controller) ? "" : " controller-list__configured--no"}`}
										>
											{isConfigured(controller) ? "Yes" : "No"}
										</span>
									</div>
								</li>
							))}
						</ul>
					</>
				)}
			</div>
			<div className="screen__bottombar">{statusMessage}</div>
			{overlay === "context-menu" && focusedController && (
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
			{overlay === "clear" && focusedController && (
				<div className="overlay-backdrop">
					<div className="overlay">
						<div className="overlay__title">
							Clear {focusedController.name}?
						</div>
						{focusedController.deviceCount > 1 && (
							<p
								style={{
									color: "var(--colour-text-muted)",
									fontSize: "12px",
									marginBottom: "12px",
								}}
							>
								{focusedController.deviceCount} devices will be affected.
							</p>
						)}
						<ul className="overlay__list">
							{CONFIRM_OPTIONS.map((option, index) => (
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
			{overlay === "delete" && focusedController && (
				<div className="overlay-backdrop">
					<div className="overlay">
						<div className="overlay__title">
							Delete {focusedController.name}?
						</div>
						{focusedController.deviceCount > 1 && (
							<p
								style={{
									color: "var(--colour-text-muted)",
									fontSize: "12px",
									marginBottom: "12px",
								}}
							>
								1 of {focusedController.deviceCount} devices will be affected.
							</p>
						)}
						<ul className="overlay__list">
							{CONFIRM_OPTIONS.map((option, index) => (
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
