export type DiscoveredGame = {
  id: string;
  title: string | null;
  publisher: string | null;
  year: number | null;
  roms: string[];
  alreadyImported: boolean;
  selected: boolean;
};

export type ImportDiscoveryState = {
  scanComplete: boolean;
  games: DiscoveredGame[];
};
