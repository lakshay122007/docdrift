import type { Finding } from "../types.js";

export function renderCompact(findings: Finding[], maxIssues?: number): string {
  const displayedFindings =
    maxIssues === undefined ? findings : findings.slice(0, maxIssues);
  return displayedFindings
    .map(
      (finding) =>
        `${finding.file}:${finding.line}:${finding.column} ${finding.severity} ${finding.rule} ${finding.message}`,
    )
    .join("\n");
}
