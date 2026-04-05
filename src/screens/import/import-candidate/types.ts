export type ImportRom = {
  label: string;
  filename: string;
};

export type ImportCandidate = {
  id: string;
  title: string | null;
  publisher: string | null;
  year: number | null;
  roms: ImportRom[];
};

export type ImportCandidateState = {
  queue: ImportCandidate[];
  currentIndex: number;
};
