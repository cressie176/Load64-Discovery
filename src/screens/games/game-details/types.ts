export interface GameScreenshot {
  slot: "loading" | "title" | "gameplay";
  url: string;
}

export interface GameSource {
  catalogueName: string;
  entryId: string;
}

export interface GameDetails {
  id: string;
  title: string;
  publisher: string;
  year: number;
  colourEncoding: "pal" | "ntsc" | "unknown";
  trueDriveEmulation: boolean;
  coverUrl?: string;
  notes?: string;
  screenshots: GameScreenshot[];
  sources: GameSource[];
  hasRom: boolean;
  hasQuickstart: boolean;
  hasContinue: boolean;
  hasAnySnapshot: boolean;
  inheritDefaultProfile: boolean;
}

export interface GameDetailsState {
  games: GameDetails[];
}
