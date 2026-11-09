import type { Finding, ScriptReference } from "../../types.js";
export function findMissingBins(
  references: ScriptReference[],
  bins: Set<string>,
): Finding[] {
  return references
    .filter(
      (reference) => reference.command.startsWith("npx ") && !bins.has(reference.script),
    )
    .map((reference) => ({
      ...reference,
      rule: "docs-bin-missing",
      severity: "warn",
      message: `local binary is missing: ${reference.script}`,
    }));
}
