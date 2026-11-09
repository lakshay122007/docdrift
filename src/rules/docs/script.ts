import type { Finding, ScriptReference } from "../../types.js";
export function findMissingScripts(
  references: ScriptReference[],
  scripts: Record<string, string>,
): Finding[] {
  return references
    .filter(
      (reference) =>
        !(reference.script in scripts) &&
        !["install", "ci", "init", "publish", "pack", "login", "whoami", "run"].includes(
          reference.script,
        ),
    )
    .map((reference) => ({
      ...reference,
      rule: "docs-script-missing",
      severity: "error",
      message: `script is not in package.json: ${reference.script}`,
    }));
}
