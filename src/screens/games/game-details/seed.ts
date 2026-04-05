import type { GameDetailsState } from "./types";

export const SEED_GAME_DETAILS: GameDetailsState = {
	games: [
		{
			id: "game-bubble",
			title: "Bubble Bobble",
			publisher: "Taito",
			year: 1987,
			coverUrl: "https://placehold.co/160x200/1a1a2e/4040ff?text=Bubble+Bobble",
			notes:
				"Classic arcade platformer. Collect all the bubbles to complete each level. Two-player simultaneous co-op.",
			screenshots: [
				{
					slot: "loading",
					url: "https://placehold.co/320x200/0d0d0d/4040ff?text=Loading+Screen",
				},
				{
					slot: "title",
					url: "https://placehold.co/320x200/0d0d0d/4040ff?text=Title+Screen",
				},
				{
					slot: "gameplay",
					url: "https://placehold.co/320x200/0d0d0d/4040ff?text=Gameplay",
				},
			],
			sources: [
				{ catalogueName: "GameBase64", entryId: "243" },
				{ catalogueName: "MobyGames", entryId: "1188" },
			],
			hasRom: true,
			hasQuickstart: true,
			hasContinue: true,
			hasAnySnapshot: true,
		},
		{
			id: "game-elite",
			title: "Elite",
			publisher: "Firebird",
			year: 1985,
			coverUrl: "https://placehold.co/160x200/1a1a2e/4040ff?text=Elite",
			notes:
				"Space trading and combat simulator. Reach Elite status by trading, fighting and exploring the galaxy.",
			screenshots: [
				{
					slot: "title",
					url: "https://placehold.co/320x200/0d0d0d/4040ff?text=Title+Screen",
				},
				{
					slot: "gameplay",
					url: "https://placehold.co/320x200/0d0d0d/4040ff?text=Gameplay",
				},
			],
			sources: [{ catalogueName: "GameBase64", entryId: "881" }],
			hasRom: true,
			hasQuickstart: false,
			hasContinue: true,
			hasAnySnapshot: true,
		},
		{
			id: "game-iridis",
			title: "Iridis Alpha",
			publisher: "Hewson Consultants",
			year: 1986,
			coverUrl: "https://placehold.co/160x200/1a1a2e/4040ff?text=Iridis+Alpha",
			notes: "Shoot-em-up by Jeff Minter. Features psychedelic visuals.",
			screenshots: [
				{
					slot: "gameplay",
					url: "https://placehold.co/320x200/0d0d0d/4040ff?text=Gameplay",
				},
			],
			sources: [{ catalogueName: "GameBase64", entryId: "1654" }],
			hasRom: true,
			hasQuickstart: true,
			hasContinue: false,
			hasAnySnapshot: true,
		},
		{
			id: "game-monty",
			title: "Monty on the Run",
			publisher: "Gremlin Graphics",
			year: 1985,
			coverUrl:
				"https://placehold.co/160x200/1a1a2e/4040ff?text=Monty+on+the+Run",
			notes:
				"Monty Mole must escape from prison and make his way to freedom in Europe.",
			screenshots: [
				{
					slot: "loading",
					url: "https://placehold.co/320x200/0d0d0d/4040ff?text=Loading+Screen",
				},
				{
					slot: "gameplay",
					url: "https://placehold.co/320x200/0d0d0d/4040ff?text=Gameplay",
				},
			],
			sources: [
				{ catalogueName: "GameBase64", entryId: "2301" },
				{ catalogueName: "MobyGames", entryId: "7823" },
			],
			hasRom: true,
			hasQuickstart: true,
			hasContinue: true,
			hasAnySnapshot: true,
		},
		{
			id: "game-outrun",
			title: "Outrun",
			publisher: "U.S. Gold",
			year: 1988,
			notes: "Racing game. No ROM has been configured yet.",
			screenshots: [],
			sources: [{ catalogueName: "GameBase64", entryId: "2879" }],
			hasRom: false,
			hasQuickstart: false,
			hasContinue: false,
			hasAnySnapshot: false,
		},
		{
			id: "game-summer",
			title: "Summer Games II",
			publisher: "Epyx",
			year: 1985,
			coverUrl:
				"https://placehold.co/160x200/1a1a2e/4040ff?text=Summer+Games+II",
			screenshots: [
				{
					slot: "title",
					url: "https://placehold.co/320x200/0d0d0d/4040ff?text=Title+Screen",
				},
			],
			sources: [],
			hasRom: true,
			hasQuickstart: false,
			hasContinue: false,
			hasAnySnapshot: false,
		},
		{
			id: "game-zzap",
			title: "Zzap!64 Megatape 1",
			publisher: "Newsfield Publications",
			year: 1986,
			coverUrl:
				"https://placehold.co/160x200/1a1a2e/4040ff?text=Zzap!64+Megatape+1",
			screenshots: [],
			sources: [],
			hasRom: true,
			hasQuickstart: false,
			hasContinue: false,
			hasAnySnapshot: false,
		},
	],
};
