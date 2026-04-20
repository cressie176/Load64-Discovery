import { deriveUnrecognisedTitle } from "./title.ts";
import type { DiscoveredGame } from "./types.ts";

export function formatTitle(game: DiscoveredGame): string {
  if (game.title !== null) return game.title;
  return deriveUnrecognisedTitle(game.roms);
}

export function formatPublisher(publisher: string | null): string {
  return publisher ?? "—";
}

export function formatYear(year: number | null): string {
  return year !== null ? String(year) : "—";
}

export function selectionCount(games: DiscoveredGame[]): number {
  return games.filter((g) => g.selected).length;
}

export function buildImportQueue(games: DiscoveredGame[]): {
  id: string;
  title: string | null;
  publisher: string | null;
  year: number | null;
  roms: { label: string; filename: string }[];
}[] {
  const selected = games.filter((g) => g.selected);
  const newGames = selected
    .filter((g) => !g.alreadyImported)
    .sort((a, b) => formatTitle(a).localeCompare(formatTitle(b)));
  const alreadyImported = selected
    .filter((g) => g.alreadyImported)
    .sort((a, b) => formatTitle(a).localeCompare(formatTitle(b)));

  return [...newGames, ...alreadyImported].map((g) => ({
    id: g.id,
    title: g.title,
    publisher: g.publisher,
    year: g.year,
    roms: g.roms.map((filename, index) => ({
      label: g.roms.length === 1 ? "Disk 1" : `Disk ${index + 1}`,
      filename,
    })),
  }));
}

export function importCtaLabel(count: number): string {
  if (count === 1) return "Import 1 Game";
  return `Import ${count} Games`;
}
