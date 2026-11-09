import type { Fact, Finding, RunOptions, RunResult, Summary } from "./types.js";

export interface PipelineStages {
  loadConfig: (options: RunOptions) => Promise<unknown>;
  listFiles: (config: unknown) => Promise<string[]>;
  extractFacts: (files: string[], config: unknown) => Promise<Fact[]>;
  applyRules: (facts: Fact[], config: unknown) => Promise<Finding[]>;
  filterFindings: (findings: Finding[], config: unknown) => Promise<Finding[]>;
}

const emptyStages: PipelineStages = {
  loadConfig: async () => ({}),
  listFiles: async () => [],
  extractFacts: async () => [],
  applyRules: async () => [],
  filterFindings: async (findings) => findings,
};

export function sortAndDedupeFindings(findings: Finding[]): Finding[] {
  const sortedFindings = [...findings].sort((first, second) => {
    return (
      first.file.localeCompare(second.file) ||
      first.line - second.line ||
      first.column - second.column ||
      first.rule.localeCompare(second.rule) ||
      first.message.localeCompare(second.message)
    );
  });
  const seen = new Set<string>();

  return sortedFindings.filter((finding) => {
    const key = [
      finding.file,
      finding.line,
      finding.column,
      finding.rule,
      finding.message,
    ].join("\u0000");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function summarizeFindings(
  findings: Finding[],
  files: number,
  durationMs: number,
): Summary {
  let errors = 0;
  let warnings = 0;
  let info = 0;

  for (const finding of findings) {
    if (finding.severity === "error") {
      errors += 1;
    } else if (finding.severity === "warn") {
      warnings += 1;
    } else {
      info += 1;
    }
  }

  return { errors, warnings, info, files, durationMs };
}

export async function run(
  options: RunOptions = {},
  stages = emptyStages,
): Promise<RunResult> {
  const startedAt = performance.now();
  const config = await stages.loadConfig(options);
  const files = await stages.listFiles(config);
  const facts = await stages.extractFacts(files, config);
  const ruleFindings = await stages.applyRules(facts, config);
  const filteredFindings = await stages.filterFindings(ruleFindings, config);
  const findings = sortAndDedupeFindings(filteredFindings);

  return {
    findings,
    summary: summarizeFindings(
      findings,
      files.length,
      Math.round(performance.now() - startedAt),
    ),
  };
}
