export function deriveUnrecognisedTitle(roms: string[]): string {
  if (roms.length === 0) return "—";
  if (roms.length === 1) {
    return stripExtension(roms[0] ?? "");
  }
  return commonPrefix(roms.map(stripExtension));
}

function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(0, dot) : filename;
}

function commonPrefix(names: string[]): string {
  if (names.length === 0) return "—";
  const first = names[0] ?? "";
  let prefix = first;
  for (let i = 1; i < names.length; i++) {
    const name = names[i] ?? "";
    let j = 0;
    while (j < prefix.length && j < name.length && prefix[j] === name[j]) {
      j++;
    }
    prefix = prefix.slice(0, j);
  }
  return prefix.replace(/[-_\s]+$/, "") || "—";
}
