import { useEffect, useRef, useState } from "react";
import { useRouter } from "../../../router/RouterContext";
import { useStore } from "../../../store/StoreContext";
import "./index.css";

type FocusRegion = "list" | "topbar";

type SettingRow = {
	key: string;
	label: string;
	count: number;
	countUnit: string;
};

function pluralise(count: number, singular: string): string {
	return count === 1 ? `${count} ${singular}` : `${count} ${singular}s`;
}

function wrapIndex(index: number, delta: number, length: number): number {
	return (index + delta + length) % length;
}

interface ProfileDetailScreenProps {
	profileId: string;
}

export function ProfileDetailScreen({ profileId }: ProfileDetailScreenProps) {
	const { pop, push } = useRouter();
	const { store } = useStore();

	const profile = store.profiles.profiles.find((p) => p.id === profileId);

	const controllerCount = store.profileDetail.controllerRefs.filter(
		(r) => r.profileId === profileId,
	).length;

	const viceArgumentCount = store.viceArguments.arguments.filter(
		(a) => a.ownerId === profileId,
	).length;

	const keyMappingCount = store.profileDetail.keyMappings.filter(
		(m) => m.profileId === profileId,
	).length;

	const envVarCount = store.profileDetail.envVars.filter(
		(v) => v.profileId === profileId,
	).length;

	const rows: SettingRow[] = [
		{
			key: "controllers",
			label: "Controllers",
			count: controllerCount,
			countUnit: "controller",
		},
		{
			key: "vice-arguments",
			label: "VICE Arguments",
			count: viceArgumentCount,
			countUnit: "argument",
		},
		{
			key: "key-mappings",
			label: "Key Mappings",
			count: keyMappingCount,
			countUnit: "mapping",
		},
		{
			key: "environment-variables",
			label: "Environment Variables",
			count: envVarCount,
			countUnit: "variable",
		},
	];

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [focusRegion, setFocusRegion] = useState<FocusRegion>("list");

	const containerRef = useRef<HTMLDivElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);

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
		if (event.key === "Enter") {
			pop();
		}
	}

	function handleListKey(event: KeyboardEvent) {
		if (event.key === "ArrowDown") {
			setSelectedIndex((prev) => wrapIndex(prev, 1, rows.length));
		} else if (event.key === "ArrowUp") {
			setSelectedIndex((prev) => wrapIndex(prev, -1, rows.length));
		} else if (event.key === "Enter") {
			activateRow(rows[selectedIndex]);
		}
	}

	function activateRow(row: SettingRow) {
		if (row.key === "controllers") {
			push("controller-selection", { profileId });
		} else if (row.key === "vice-arguments") {
			push("vice-argument-list", { ownerId: profileId });
		} else if (row.key === "key-mappings") {
			push("key-mapping-list", { profileId });
		} else if (row.key === "environment-variables") {
			push("environment-variable-list", { profileId });
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

	const profileName = profile?.name ?? profileId;

	return (
		<div className="screen" ref={containerRef} tabIndex={-1}>
			<div className="screen__topbar">
				<span className="screen__topbar-title">Profiles – {profileName}</span>
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
				<div className="list__header">
					<div className="profile-detail__columns">
						<span>Setting</span>
						<span style={{ textAlign: "right" }}>Count</span>
					</div>
				</div>
				<ul className="list">
					{rows.map((row, index) => (
						<li
							key={row.key}
							className={`list__row${index === selectedIndex && focusRegion === "list" ? " list__row--selected" : ""}`}
						>
							<div className="profile-detail__columns">
								<span className="profile-detail__row-label">{row.label}</span>
								<span className="profile-detail__row-count">
									{pluralise(row.count, row.countUnit)}
								</span>
							</div>
						</li>
					))}
				</ul>
			</div>
			<div className="screen__bottombar" />
		</div>
	);
}
