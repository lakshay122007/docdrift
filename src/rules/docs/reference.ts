import type { Finding } from "../../types.js";
export function findReferenceProblems(file: string, text: string): Finding[] {
  const definitions = new Set(
    [...text.matchAll(/^\s*\[([^\]]+)\]:/gm)].map((match) =>
      (match[1] ?? "").toLowerCase(),
    ),
  );
  const uses = [...text.matchAll(/\[[^\]]+\]\[([^\]]+)\]/g)].map((match) =>
    (match[1] ?? "").toLowerCase(),
  );
  const findings: Finding[] = [];
  for (const label of uses)
    if (!definitions.has(label))
      findings.push({
        rule: "docs-ref-undefined",
        severity: "error",
        message: `reference is undefined: ${label}`,
        file,
        line: 1,
        column: 1,
      });
  for (const label of definitions)
    if (!uses.includes(label))
      findings.push({
        rule: "docs-ref-unused",
        severity: "info",
        message: `reference is unused: ${label}`,
        file,
        line: 1,
        column: 1,
      });
  return findings;
}
