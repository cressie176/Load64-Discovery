export interface GameRom {
  id: string;
  position: number;
  label: string;
  filename: string;
}

export interface GameRomListState {
  roms: Record<string, GameRom[]>;
}
