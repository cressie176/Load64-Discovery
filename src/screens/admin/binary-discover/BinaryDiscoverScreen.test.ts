import { equal as eq } from "node:assert/strict";
import { describe, it } from "node:test";

const MACHINE_BINARIES: Record<string, string> = {
	"Commodore 64": "x64sc",
	"C64 DTV": "x64dtv",
	"Commodore 128": "x128",
	"VIC-20": "xvic",
	"Commodore Plus/4": "xplus4",
	"Commodore PET": "xpet",
	"CBM-II": "xcbm2",
	"CBM 5x0": "xcbm5x0",
	"SuperCPU 64": "xscpu64",
};

function resolveViceBinPath(vicePath: string, binaryName: string): string {
	const trimmed = vicePath.replace(/\/+$/, "");
	if (trimmed.endsWith("/bin")) {
		return `${trimmed}/${binaryName}`;
	}
	return `${trimmed}/bin/${binaryName}`;
}

function discoverBinaries(
	vicePath: string,
	machineNames: string[],
): Map<string, string> {
	const discovered = new Map<string, string>();
	for (const machineName of machineNames) {
		const binaryName = MACHINE_BINARIES[machineName];
		if (binaryName) {
			discovered.set(machineName, resolveViceBinPath(vicePath, binaryName));
		}
	}
	return discovered;
}

describe("BinaryDiscoverScreen", () => {
	describe("resolveViceBinPath", () => {
		it("appends bin/<binary> when path is an app bundle", () => {
			eq(
				resolveViceBinPath("/Applications/VICE", "x64sc"),
				"/Applications/VICE/bin/x64sc",
			);
		});

		it("appends <binary> directly when path already ends in /bin", () => {
			eq(
				resolveViceBinPath("/Applications/VICE/bin", "x64sc"),
				"/Applications/VICE/bin/x64sc",
			);
		});

		it("strips trailing slashes before resolving", () => {
			eq(
				resolveViceBinPath("/Applications/VICE/", "x64sc"),
				"/Applications/VICE/bin/x64sc",
			);
		});

		it("handles bin path with trailing slash", () => {
			eq(
				resolveViceBinPath("/Applications/VICE/bin/", "x64sc"),
				"/Applications/VICE/bin/x64sc",
			);
		});
	});

	describe("discoverBinaries", () => {
		it("discovers all known machines from a bundle path", () => {
			const machineNames = Object.keys(MACHINE_BINARIES);
			const result = discoverBinaries("/Applications/VICE", machineNames);
			eq(result.size, 9);
		});

		it("resolves the Commodore 64 binary correctly", () => {
			const result = discoverBinaries("/Applications/VICE", ["Commodore 64"]);
			eq(result.get("Commodore 64"), "/Applications/VICE/bin/x64sc");
		});

		it("resolves the VIC-20 binary correctly", () => {
			const result = discoverBinaries("/Applications/VICE", ["VIC-20"]);
			eq(result.get("VIC-20"), "/Applications/VICE/bin/xvic");
		});

		it("skips unknown machine names", () => {
			const result = discoverBinaries("/Applications/VICE", [
				"Unknown Machine",
			]);
			eq(result.size, 0);
		});

		it("returns empty map for empty machine list", () => {
			const result = discoverBinaries("/Applications/VICE", []);
			eq(result.size, 0);
		});

		it("resolves paths correctly from a bin/ directory path", () => {
			const result = discoverBinaries("/Applications/VICE/bin", [
				"Commodore 64",
			]);
			eq(result.get("Commodore 64"), "/Applications/VICE/bin/x64sc");
		});
	});
});
