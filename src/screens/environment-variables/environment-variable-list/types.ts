export type EnvVarOwnerType =
	| "family"
	| "controller"
	| "profile"
	| "launch-config";

export interface EnvVar {
	id: string;
	ownerId: string;
	name: string;
	value: string;
}

export interface EnvVarOwner {
	id: string;
	name: string;
	type: EnvVarOwnerType;
	parentIds: string[];
}

export interface EnvVarsState {
	owners: EnvVarOwner[];
	variables: EnvVar[];
}

export interface EnvVarRow {
	id: string | null;
	name: string;
	value: string;
	sourceLabel: string;
	isInherited: boolean;
	ownerId: string;
}
