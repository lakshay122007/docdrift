import type { Finding, Summary } from "../types.js";

function formatSummary(summary: Summary): string {
  const parts: string[] = [];
  if (summary.errors > 0) parts.push(`${summary.errors} errors`);
  if (summary.warnings > 0) parts.push(`${summary.warnings} warnings`);
  if (summary.info > 0) parts.push(`${summary.info} info`);
  return parts.length > 0 ? parts.join(", ") : "no findings";
}

export function renderTree(
  root: string,
  findings: Finding[],
  summary: Summary,
  maxIssues?: number,
): string {
  const displayedFindings =
    maxIssues === undefined ? findings : findings.slice(0, maxIssues);
  if (displayedFindings.length === 0) {
    return `driftcheck  ${root}  (${summary.files} files scanned, ${summary.durationMs}ms)\n\nnothing to scan\n`;
  }
  const lines = [
    `driftcheck  ${root}  (${summary.files} files scanned, ${summary.durationMs}ms)`,
    "",
  ];
  for (const [index, finding] of displayedFindings.entries()) {
    const branch = index === displayedFindings.length - 1 ? "└─" : "├─";
    lines.push(
      `${branch} ${finding.file}:${finding.line}:${finding.column}  ${finding.severity}  ${finding.rule}  ${finding.message}`,
    );
  }
  if (displayedFindings.length < findings.length) {
    lines.push(
      `… ${findings.length - displayedFindings.length} more findings not displayed`,
    );
  }
  lines.push("", formatSummary(summary));
  return `${lines.join("\n")}\n`;
}
