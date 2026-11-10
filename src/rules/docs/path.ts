import { access } from "node:fs/promises";
import { resolve } from "node:path";
import type { Finding, PathMention } from "../../types.js";
export async function findMissingPaths(
  root: string,
  mentions: PathMention[],
): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const mention of mentions) {
    if (
      /^(?:https?:|mailto:|tel:|~\/|[A-Z]:\\|path\/to\/)|[*?{}]|<|\$/.test(mention.value)
    )
      continue;
    const candidate = mention.value.replace(/^\.\//, "");
    const topLevel = candidate.split("/", 1)[0] ?? "";
    if (
      !mention.value.startsWith(".") &&
      candidate.includes("/") &&
      !(await exists(resolve(root, topLevel)))
    )
      continue;
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

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
