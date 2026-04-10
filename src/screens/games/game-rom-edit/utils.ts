const DISK_EXTENSIONS = new Set([".d64", ".d71", ".d81"]);
const TAPE_EXTENSIONS = new Set([".tap", ".t64"]);
const CARTRIDGE_EXTENSIONS = new Set([".crt"]);

export const SUPPORTED_EXTENSIONS = new Set([
  ...DISK_EXTENSIONS,
  ...TAPE_EXTENSIONS,
  ...CARTRIDGE_EXTENSIONS,
]);

function mediaType(ext: string): "Disk" | "Tape" | "Cartridge" | null {
  if (DISK_EXTENSIONS.has(ext)) return "Disk";
  if (TAPE_EXTENSIONS.has(ext)) return "Tape";
  if (CARTRIDGE_EXTENSIONS.has(ext)) return "Cartridge";
  return null;
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

function basenameWithoutExt(filename: string): string {
  const base = filename.includes("/")
    ? (filename.split("/").pop() ?? filename)
    : filename;
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(0, dot) : base;
}

function extractNumber(filename: string): number | null {
  const base = basenameWithoutExt(filename);
  const match = base.match(/(\d+)/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

export function deriveLabel(filename: string, isOnlyRom: boolean): string {
  const ext = extensionOf(filename);
  const type = mediaType(ext);

  if (type !== null) {
    const n = extractNumber(filename);
    if (n !== null) return `${type} ${n}`;
    if (isOnlyRom) return `${type} 1`;
  }

  return basenameWithoutExt(filename);
}

export function isSupportedRomFile(filename: string): boolean {
  return SUPPORTED_EXTENSIONS.has(extensionOf(filename));
}
