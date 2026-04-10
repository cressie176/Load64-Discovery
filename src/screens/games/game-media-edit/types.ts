export type MediaSlot =
  | "cover-thumbnail"
  | "loading-screen"
  | "title-screen"
  | "gameplay-screen";

export interface MediaCandidate {
  id: string;
  url: string;
}

export interface GameMediaEditState {
  candidates: Record<string, MediaCandidate[]>;
}
