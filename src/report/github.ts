import type { Finding } from "../types.js";
export function renderGitHub(findings: Finding[]): string {
  return findings
    .map(
      (finding) =>
        `::${finding.severity === "error" ? "error" : "warning"} file=${finding.file},line=${finding.line},col=${finding.column}::${finding.rule} ${finding.message}`,
    )
    .join("\n");
}
