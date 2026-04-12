export type CatalogueFlow = "details" | "cover-art" | "screenshots";

export interface FetchedGameDetails {
  title?: string;
  publisher?: string;
  year?: string;
  notes?: string;
}

export function deriveScreenTitle(
  flow: CatalogueFlow,
  importMode: boolean,
  gameTitle: string,
  importTitle?: string,
): string {
  const label = importTitle ?? gameTitle;
  const prefix = importMode ? `Import Games > ${label}` : label;

  switch (flow) {
    case "details":
      return `${prefix} > Details > From Catalogue`;
    case "cover-art":
      return `${prefix} > Media > Cover Art > From Catalogue`;
    case "screenshots":
      return `${prefix} > Media > Screenshots > From Catalogue`;
  }
}

export function simulateFetch(
  _gameId: string,
  catalogueName: string,
  entryId: string,
): Promise<FetchedGameDetails> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (catalogueName === "GameBase64") {
        const results: Record<string, FetchedGameDetails> = {
          "243": {
            title: "Bubble Bobble (Taito, 1987)",
            publisher: "Taito Corporation",
            notes:
              "Classic arcade conversion. Bubble Bobble was developed by Taito and released for the C64 in 1987. Features all 100 levels from the original arcade release.",
          },
          "881": {
            title: "Elite",
            publisher: "Firebird Software",
            year: "1985",
            notes:
              "Space trading and combat game. Originally developed by David Braben and Ian Bell. The C64 version was published by Firebird in 1985.",
          },
          "1654": {
            title: "Iridis Alpha",
            publisher: "Llamasoft",
            notes:
              "A vertically scrolling shoot-em-up by Jeff Minter, published by Hewson Consultants.",
          },
          "2301": {
            title: "Monty on the Run",
            publisher: "Gremlin Graphics Software",
            notes:
              "Monty Mole escapes from prison and must reach Europe. Features a Rob Hubbard soundtrack.",
          },
          "2879": {
            title: "Out Run",
            publisher: "U.S. Gold Ltd.",
            year: "1987",
            notes: "Driving game based on the Sega arcade original.",
          },
          "3847": {
            title: "Turrican II: The Final Fight",
            publisher: "Rainbow Arts Software",
            notes:
              "Platform action game developed by Factor 5. Features music by Chris Hülsbeck.",
          },
        };
        const result = results[entryId];
        if (result) {
          resolve(result);
        } else {
          reject(new Error(`No entry found for ${catalogueName}: ${entryId}`));
        }
      } else if (catalogueName === "MobyGames") {
        const results: Record<string, FetchedGameDetails> = {
          "1188": {
            title: "Bubble Bobble",
            publisher: "Taito",
            year: "1987",
            notes:
              "Platform game where players control dragons Bub and Bob. Trap enemies in bubbles then burst them.",
          },
          "7823": {
            title: "Monty on the Run",
            publisher: "Gremlin Graphics",
            year: "1985",
            notes:
              "Side-scrolling platform game featuring Monty the mole. Escape from prison across multiple screens.",
          },
        };
        const result = results[entryId];
        if (result) {
          resolve(result);
        } else {
          reject(new Error(`No entry found for ${catalogueName}: ${entryId}`));
        }
      } else {
        reject(new Error(`Unknown catalogue: ${catalogueName}`));
      }
    }, 800);
  });
}
