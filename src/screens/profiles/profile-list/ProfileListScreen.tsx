import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import type { Profile } from "./types";
import "./index.css";

type FocusRegion = "list" | "topbar";
type TopBarCta = "add" | "back";
type Overlay = "delete";

const TOP_BAR_CTAS: TopBarCta[] = ["add", "back"];
const DELETE_OPTIONS = ["Yes", "No"] as const;

function wrapIndex(index: number, delta: number, length: number): number {
	return (index + delta + length) % length;
}

function sortProfiles(profiles: Profile[]): Profile[] {
	return [...profiles].sort((a, b) => a.name.localeCompare(b.name));
}

interface ProfileListScreenProps {
	statusMessage?: string;
}

export function ProfileListScreen({
	statusMessage: initialStatusMessage = "",
}: ProfileListScreenProps) {
	const { pop, push } = useRouter();
	const { store, setStore } = useStore();

	const profiles = sortProfiles(store.profiles.profiles);

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
		profiles.length > 0 ? Math.min(selectedIndex, profiles.length - 1) : 0;
	const focusedProfile = profiles[safeSelectedIndex];

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

	function buildContextMenuItems(profile: Profile | undefined): string[] {
		if (!profile) return ["Rename", "Delete"];
		const items: string[] = [];
		if (!profile.isDefault) items.push("Set Default");
		items.push("Rename");
		items.push("Delete");
		return items;
	}

	function handleContextMenuKey(event: KeyboardEvent) {
		const menuItems = buildContextMenuItems(focusedProfile);
		if (event.key === "ArrowDown") {
			setContextMenuIndex((prev) => wrapIndex(prev, 1, menuItems.length));
		} else if (event.key === "ArrowUp") {
			setContextMenuIndex((prev) => wrapIndex(prev, -1, menuItems.length));
		} else if (event.key === "Enter") {
			const action = menuItems[contextMenuIndex];
			setShowContextMenu(false);
			if (action === "Set Default") {
				applySetDefault();
			} else if (action === "Rename") {
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
		if (profiles.length === 0) return;
		if (event.key === "ArrowDown") {
			setSelectedIndex((prev) => wrapIndex(prev, 1, profiles.length));
			setStatusMessage("");
		} else if (event.key === "ArrowUp") {
			setSelectedIndex((prev) => wrapIndex(prev, -1, profiles.length));
			setStatusMessage("");
		} else if (event.key === "Enter") {
			navigateToDetail();
		}
	}

	function navigateToDetail() {
		if (!focusedProfile) return;
		push("profile-detail", { profileId: focusedProfile.id });
	}

	function toggleFocusRegion() {
		if (focusRegion === "list") {
			setFocusRegion("topbar");
			setFocusedCta("add");
			addButtonRef.current?.focus();
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
		push("profile-edit");
	}

	function navigateToRename() {
		if (!focusedProfile) return;
		push("profile-edit", { profileId: focusedProfile.id });
	}

	function openDeleteOverlay() {
		setOverlay("delete");
		setOverlayIndex(0);
	}

	function applySetDefault() {
		if (!focusedProfile) return;
		const profileName = focusedProfile.name;
		setStore((prev) => ({
			...prev,
			profiles: {
				...prev.profiles,
				profiles: prev.profiles.profiles.map((p) => ({
					...p,
					isDefault: p.id === focusedProfile.id,
				})),
			},
		}));
		setStatusMessage(`${profileName} set as default`);
	}

	function confirmDelete() {
		if (!focusedProfile) return;
		const deletedName = focusedProfile.name;
		setStore((prev) => ({
			...prev,
			profiles: {
				...prev.profiles,
				profiles: prev.profiles.profiles.filter(
					(p) => p.id !== focusedProfile.id,
				),
			},
		}));
		setOverlay(null);
		setStatusMessage(`${deletedName} deleted`);
		setSelectedIndex((prev) => Math.max(0, prev - 1));
	}

	function deleteWarningMessage(profile: Profile | undefined): string {
		if (!profile) return "";
		const usageCount = countProfileUsage(profile.id);
		if (usageCount === 0) return "";
		return `${profile.name} is used by ${usageCount} game(s). Deleting it will remove their profile reference.`;
	}

	function countProfileUsage(profileId: string): number {
		return store.profiles.gameProfileRefs.filter(
			(ref) => ref.profileId === profileId,
		).length;
	}

	const contextMenuItems = buildContextMenuItems(focusedProfile);
	const warningMessage = deleteWarningMessage(focusedProfile);

	return (
		<div className="screen" ref={containerRef} tabIndex={-1}>
			<div className="screen__topbar">
				<span className="screen__topbar-title">Profiles</span>
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
				{profiles.length === 0 ? (
					<p>Select Add to create a profile.</p>
				) : (
					<ul className="list">
						{profiles.map((profile, index) => (
							<li
								key={profile.id}
								className={`list__row${index === safeSelectedIndex && focusRegion === "list" ? " list__row--selected" : ""}`}
								style={{ display: "flex", gap: "16px" }}
							>
								<span className="profile-list__row-name">{profile.name}</span>
								{profile.isDefault && (
									<span className="profile-list__row-badge">(default)</span>
								)}
							</li>
						))}
					</ul>
				)}
			</div>
			<div className="screen__bottombar">{statusMessage}</div>
			{overlay === "delete" && focusedProfile && (
				<div className="overlay-backdrop">
					<div className="overlay">
						<div className="overlay__title">Delete {focusedProfile.name}?</div>
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
			{showContextMenu && focusedProfile && (
				<div
					className="overlay-backdrop"
					style={{ alignItems: "flex-start", paddingTop: "80px" }}
				>
					<div className="overlay">
						<ul className="overlay__list">
							{contextMenuItems.map((item, index) => (
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
