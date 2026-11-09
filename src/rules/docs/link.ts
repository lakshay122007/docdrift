import type { Finding, MarkdownHeading, MarkdownLink } from "../../types.js";
import { pathExists, resolveLinkTarget } from "../../fs/link-target.js";

export async function findBrokenLinks(
  root: string,
  links: MarkdownLink[],
  headings: MarkdownHeading[],
): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const link of links) {
    const target = resolveLinkTarget(root, link.file, link.target);
    if (!target) continue;
    if (target.outsideRoot) {
      findings.push({
        ...link,
        rule: "docs-link-outside-root",
        severity: "warn",
        message: "link resolves outside the repository root",
      });
      continue;
    }
    if (!(await pathExists(target.path))) {
      findings.push({
        ...link,
        rule: link.image ? "docs-image-missing" : "docs-link-broken-file",
        severity: "error",
        message: `target does not exist: ${link.target}`,
      });
      continue;
    }
    if (target.anchor && !/^L\d+(?:-L\d+)?$/.test(target.anchor)) {
      const targetHeadings = headings.filter(
        (heading) => heading.file === target.path || heading.file === link.file,
      );
      if (!targetHeadings.some((heading) => heading.slug === target.anchor))
        findings.push({
          ...link,
          rule: "docs-link-broken-anchor",
          severity: "error",
          message: `anchor does not exist: #${target.anchor}`,
        });
    }
  }
  return findings;
}
