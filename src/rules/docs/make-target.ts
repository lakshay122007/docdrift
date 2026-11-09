import type { Finding, ScriptReference } from "../../types.js";
export function findMissingMakeTargets(
  references: ScriptReference[],
  targets: Set<string>,
): Finding[] {
  return references
    .filter(
      (reference) =>
        reference.command.startsWith("make ") && !targets.has(reference.script),
    )
    .map((reference) => ({
      ...reference,
      rule: "docs-make-target-missing",
      severity: "warn",
      message: `make target is missing: ${reference.script}`,
    }));
}
