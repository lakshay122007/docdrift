import type { Finding, PathMention } from "../../types.js";
export function findFencesWithoutLanguage(fences: PathMention[]): Finding[] {
  return fences.map((fence) => ({
    ...fence,
    rule: "docs-fence-no-lang",
    severity: "info",
    message: "fenced code block has no language",
  }));
}
