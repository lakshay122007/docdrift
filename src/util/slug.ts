function plainHeadingText(value: string): string {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function createSlug(text: string, seen: Map<string, number> = new Map()): string {
  const base = plainHeadingText(text)
    .toLowerCase()
    .replace(/[\p{Extended_Pictographic}]/gu, "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}
