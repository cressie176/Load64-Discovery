export type ImportSuggestion = {
  id: string;
  title: string | null;
  publisher: string | null;
  year: number | null;
  romCount: number;
  filenames: string[];
};

export type ImportDiscoveryState = {
  games: number;
  recognised: number;
  unrecognised: number;
  duplicates: number;
  ignored: number;
  sample: ImportSuggestion[];
};
