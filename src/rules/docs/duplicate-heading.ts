import type { Finding, MarkdownHeading } from "../../types.js";
export function findDuplicateHeadings(headings: MarkdownHeading[]): Finding[] {
  const seen = new Set<string>();
  return headings
    .filter((heading) => {
      const key = `${heading.file}\0${heading.text}`;
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    })
    .map((heading) => ({
      ...heading,
      rule: "docs-duplicate-heading",
      severity: "info",
      message: `duplicate heading: ${heading.text}`,
    }));
}
