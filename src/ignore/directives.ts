import type { Finding } from "../types.js";

export function filterInlineIgnores(text: string, findings: Finding[]): Finding[] {
  const lines = text.split("\n");
  return findings.filter((finding) => {
    const previous = lines[finding.line - 2] ?? "";
    const current = lines[finding.line - 1] ?? "";
    const directive = `${previous}\n${current}`.match(
      /driftcheck-ignore(?:-next-line)?\s+([\w-]+)?/,
    );
    if (directive && (directive[1] === undefined || directive[1] === finding.rule))
      return false;
    let disabled = false;
    for (const line of lines.slice(0, finding.line)) {
      if (new RegExp(`driftcheck-disable\\s+${finding.rule}`).test(line)) disabled = true;
      if (new RegExp(`driftcheck-enable\\s+${finding.rule}`).test(line)) disabled = false;
    }
    return !disabled;
  });
}
