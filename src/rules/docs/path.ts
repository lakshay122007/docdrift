import { access } from "node:fs/promises";
import { resolve } from "node:path";
import type { Finding, PathMention } from "../../types.js";
export async function findMissingPaths(
  root: string,
  mentions: PathMention[],
): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const mention of mentions) {
    if (/^(?:https?:|~\/|[A-Z]:\\|path\/to\/)|[*?{}]|<|\$/.test(mention.value)) continue;
    try {
      await access(resolve(root, mention.value));
    } catch {
      findings.push({
        ...mention,
        rule: "docs-path-missing",
        severity: "warn",
        message: `path does not exist: ${mention.value}`,
      });
    }
  }
  return findings;
}
