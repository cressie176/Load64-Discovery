export type CompilationKind = "all-games" | "untested" | "user-defined";

export interface Compilation {
	id: string;
	name: string;
	kind: CompilationKind;
}

export interface CompilationGameRef {
	compilationId: string;
	gameId: string;
}

export interface CompilationsState {
	compilations: Compilation[];
	compilationGameRefs: CompilationGameRef[];
}
