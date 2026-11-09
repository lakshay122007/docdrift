import type { Finding, MarkdownLink } from "../../types.js";
export function findOrphanDocs(
  files: string[],
  links: MarkdownLink[],
  entryPoints: string[],
): Finding[] {
  const linked = new Set(links.map((link) => link.target.split(/[?#]/, 1)[0] ?? ""));
  return files
    .filter(
      (file) =>
        !entryPoints.includes(file) &&
        ![...linked].some((target) => file.endsWith(target)),
    )
    .map((file) => ({
      rule: "docs-orphan",
      severity: "warn",
      message: "markdown file is not linked from another markdown file",
      file,
      line: 1,
      column: 1,
    }));
}
