import type { RunResult } from "../types.js";

export function renderJson(root: string, result: RunResult, maxIssues?: number): string {
  const findings =
    maxIssues === undefined ? result.findings : result.findings.slice(0, maxIssues);
  return `${JSON.stringify(
    {
      version: "0.1.0",
      root,
      summary: result.summary,
      findings,
    },
    null,
    2,
  )}\n`;
}
