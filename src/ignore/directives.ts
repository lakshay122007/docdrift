import type { Finding } from "../types.js";

export function filterInlineIgnores(text: string, findings: Finding[]): Finding[] {
  const lines = text.split("\n");
  return findings.filter((finding) => {
    const previous = lines[finding.line - 2] ?? "";
    const current = lines[finding.line - 1] ?? "";
    const directive = `${previous}\n${current}`.match(
      /docdrift-ignore(?:-next-line)?\s+([\w-]+)?/,
    );
    return !directive || (directive[1] !== undefined && directive[1] !== finding.rule);
  });
}
