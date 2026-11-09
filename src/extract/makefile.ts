export function extractMakeTargets(text: string): Set<string> {
  return new Set(
    [...text.matchAll(/^([A-Za-z0-9_.-]+)\s*:/gm)].map((match) => match[1] ?? ""),
  );
}
