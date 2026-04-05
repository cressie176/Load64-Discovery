import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { ControllerDetailItem } from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";

const ITEMS: ControllerDetailItem[] = [
	"family",
	"controls",
	"environment-variables",
];

function labelFor(item: ControllerDetailItem): string {
	if (item === "family") return "Family";
	if (item === "controls") return "Controls";
	return "Environment Variables";
}

function wrapIndex(index: number, delta: number, length: number): number {
	return (index + delta + length) % length;
}

interface ControllerDetailScreenProps {
	controllerId: string;
	statusMessage?: string;
}

export function ControllerDetailScreen({
	controllerId,
	statusMessage: initialStatusMessage = "",
}: ControllerDetailScreenProps) {
	const { pop, push } = useRouter();
	const { store } = useStore();

	const controller = store.controllers.find((c) => c.id === controllerId);
	const familyEntry = store.controllerFamilies.controllers.find(
		(c) => c.id === controllerId,
	);
	const familyId = familyEntry?.familyId ?? null;
	const family = familyId
		? store.controllerFamilies.families.find((f) => f.id === familyId)
		: null;

	const isConnected = controller?.status === "connected";
	const deviceName = controller?.name ?? controllerId;
	const familyName = family?.name ?? "(No Family)";
	const guid = controller?.guid ?? "";

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");
	const [statusMessage, setStatusMessage] = useState(initialStatusMessage);

	const prevFamilyIdRef = useRef<string | null | undefined>(familyId);

	const containerRef = useRef<HTMLDivElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		containerRef.current?.focus();
	}, []);

	useEffect(() => {
		const prev = prevFamilyIdRef.current;
		if (prev !== familyId) {
			if (familyId === null) {
				setStatusMessage("Family removed");
			} else {
				const assignedFamily = store.controllerFamilies.families.find(
					(f) => f.id === familyId,
				);
				if (assignedFamily) {
					setStatusMessage(`Family set to ${assignedFamily.name}`);
				}
			}
			prevFamilyIdRef.current = familyId;
		}
	});

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
		handleListKey(event);
	}

	function handleTopBarKey(event: KeyboardEvent) {
		if (event.key === "Enter") {
			pop();
		}
	}

	function handleListKey(event: KeyboardEvent) {
		if (!isConnected) return;
		if (event.key === "ArrowDown") {
			setSelectedIndex((prev) => wrapIndex(prev, 1, ITEMS.length));
		} else if (event.key === "ArrowUp") {
			setSelectedIndex((prev) => wrapIndex(prev, -1, ITEMS.length));
		} else if (event.key === "Enter") {
			activateItem(ITEMS[selectedIndex]);
		}
	}

	function activateItem(item: ControllerDetailItem) {
		if (item === "family") {
			push("controller-family-selection", { controllerId });
		} else if (item === "controls") {
			push("control-list", { ownerId: controllerId });
		} else if (item === "environment-variables") {
			push("environment-variable-list", { ownerId: controllerId });
		}
	}

	function toggleFocusRegion(_reverse = false) {
		if (focusRegion === "list") {
			setFocusRegion("topbar");
			backButtonRef.current?.focus();
		} else {
			setFocusRegion("list");
			containerRef.current?.focus();
		}
	}

	const title = `${deviceName} - ${familyName} - ${guid}`;

	return (
		<div className="screen" ref={containerRef} tabIndex={-1}>
			<div className="screen__topbar">
				<span className="screen__topbar-title controller-detail__title">
					{title}
				</span>
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
					{ITEMS.map((item, index) => (
						<li
							key={item}
							className={[
								"list__row",
								index === selectedIndex && focusRegion === "list"
									? "list__row--selected"
									: "",
								!isConnected ? "list__row--disabled" : "",
							]
								.filter(Boolean)
								.join(" ")}
						>
							{labelFor(item)}
						</li>
					))}
				</ul>
			</div>
			<div className="screen__bottombar">
				{!isConnected ? `Connect ${deviceName} to reconfigure.` : statusMessage}
			</div>
		</div>
	);
}
