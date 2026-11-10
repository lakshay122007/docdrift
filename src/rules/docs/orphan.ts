import { normalize } from "node:path";
import type { Finding, MarkdownLink } from "../../types.js";
export function findOrphanDocs(
  files: string[],
  links: MarkdownLink[],
  entryPoints: string[],
): Finding[] {
  const linked = new Set(
    links.map((link) =>
      normalize(link.target.split(/[?#]/, 1)[0] ?? "").replace(/^\.\//, ""),
    ),
  );
  return files
    .filter((file) => !entryPoints.includes(file) && !linked.has(normalize(file)))
    .map((file) => ({
      rule: "docs-orphan",
      severity: "warn",
      message: "markdown file is not linked from another markdown file",
      file,
      line: 1,
      column: 1,
    }));
}
