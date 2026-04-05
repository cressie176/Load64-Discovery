export interface Game {
  id: string;
  title: string;
  sortTitle: string;
  publisher: string;
  year: number;
  coverUrl?: string;
  launchable: boolean;
  blockingReason?: string;
  hasRom: boolean;
  hasQuickstart: boolean;
  hasSave: boolean;
}

export interface CarouselState {
  games: Game[];
  activeCompilationId: string;
  compilationPositions: Record<string, number>;
}
