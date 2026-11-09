import type { Finding } from "../types.js";
export function renderSarif(findings: Finding[]): string {
  return JSON.stringify(
    {
      version: "2.1.0",
      runs: [
        {
          tool: { driver: { name: "driftcheck", rules: [] } },
          results: findings.map((finding) => ({
            ruleId: finding.rule,
            level: finding.severity === "warn" ? "warning" : finding.severity,
            message: { text: finding.message },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: finding.file },
                  region: { startLine: finding.line, startColumn: finding.column },
                },
              },
            ],
          })),
        },
      ],
    },
    null,
    2,
  );
}
