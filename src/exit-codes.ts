import type { Finding, Severity } from "./types.js";

const severityRank: Record<Severity, number> = {
  error: 3,
  warn: 2,
  info: 1,
};

export function exitCodeForFindings(
  findings: Finding[],
  failOn: Severity | "never" = "error",
): number {
  if (failOn === "never") {
    return 0;
  }

  return findings.some(
    (finding) => severityRank[finding.severity] >= severityRank[failOn],
  )
    ? 1
    : 0;
}
