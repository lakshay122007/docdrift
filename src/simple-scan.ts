import { basename, relative, resolve } from "node:path";

import { loadConfig } from "./config/load.js";
import { extractDotenv } from "./extract/dotenv.js";
import { extractComposeEnv } from "./extract/compose.js";
import { extractDockerfileEnv } from "./extract/dockerfile.js";
import { extractJavaScriptEnv } from "./extract/js-env.js";
import { extractMarkdown } from "./extract/markdown.js";
import { extractWorkflowEnv } from "./extract/workflow.js";
import { findRoot } from "./fs/root.js";
import { readTextFile } from "./fs/read.js";
import { walkFiles } from "./fs/walk.js";
import { renderCompact } from "./report/compact.js";
import { renderGitHub } from "./report/github.js";
import { renderJson } from "./report/json.js";
import { renderSarif } from "./report/sarif.js";
import { renderTree } from "./report/tree.js";
import { findBrokenLinks } from "./rules/docs/link.js";
import { findMissingScripts } from "./rules/docs/script.js";
import { findDuplicateEnvKeys } from "./rules/env/duplicate-key.js";
import { findUndocumentedEnv } from "./rules/env/undocumented.js";
import { findUnusedEnv } from "./rules/env/unused.js";
import { sortAndDedupeFindings, summarizeFindings } from "./run.js";
import { exitCodeForFindings } from "./exit-codes.js";
import type {
  EnvDeclaration,
  EnvRead,
  Finding,
  MarkdownHeading,
  MarkdownLink,
  ScriptReference,
} from "./types.js";
import { readPackageScripts } from "./extract/package-json.js";

export interface ScanOptions {
  format?: "tree" | "compact" | "json" | "github" | "sarif";
  mode?: "all" | "env" | "docs";
  failOn?: "error" | "warn" | "info" | "never";
  maxIssues?: number;
}

export async function scan(
  path: string,
  options: ScanOptions = {},
): Promise<{ output: string; exitCode: number }> {
  const root = await findRoot(path);
  const config = await loadConfig(root);
  const files = await walkFiles(root, { ignorePatterns: config.ignore });
  const reads: EnvRead[] = [];
  const declarations: EnvDeclaration[] = [];
  const headings: MarkdownHeading[] = [];
  const links: MarkdownLink[] = [];
  const scripts: ScriptReference[] = [];
  const findings: Finding[] = [];
  for (const file of files) {
    const content = await readTextFile(file);
    if (content.text === null) continue;
    const extension = file.split(".").pop()?.toLowerCase();
    if (["js", "mjs", "cjs", "ts", "tsx", "jsx"].includes(extension ?? "")) {
      const result = extractJavaScriptEnv(content.text, relative(root, file));
      reads.push(...result.reads);
    }
    if (config.env.declarationFiles.includes(basename(file))) {
      declarations.push(
        ...extractDotenv(content.text, relative(root, file)).declarations,
      );
    }
    if (/^(?:docker-)?compose.*\.ya?ml$/i.test(basename(file)))
      declarations.push(...extractComposeEnv(content.text, relative(root, file)));
    if (/^dockerfile/i.test(basename(file)))
      declarations.push(...extractDockerfileEnv(content.text, relative(root, file)));
    if (file.includes("/.github/workflows/") && /\.ya?ml$/i.test(file))
      declarations.push(...extractWorkflowEnv(content.text, relative(root, file)));
    if (["md", "markdown", "mdx"].includes(extension ?? "")) {
      const result = extractMarkdown(content.text, file);
      headings.push(...result.headings);
      links.push(...result.links);
      scripts.push(...result.scripts);
    }
  }
  if (options.mode !== "docs") {
    findings.push(...findUndocumentedEnv(reads, declarations, config.env));
    findings.push(...findUnusedEnv(declarations, reads, config.env));
    findings.push(...findDuplicateEnvKeys(declarations));
  }
  if (options.mode !== "env") {
    findings.push(...(await findBrokenLinks(root, links, headings)));
    findings.push(
      ...findMissingScripts(
        scripts,
        await readPackageScripts(resolve(root, "package.json")),
      ),
    );
  }
  const sorted = sortAndDedupeFindings(findings)
    .filter(
      (finding) => config.rules[finding.rule as keyof typeof config.rules] !== "off",
    )
    .map((finding) => {
      const configuredSeverity = config.rules[finding.rule as keyof typeof config.rules];
      return {
        ...finding,
        severity:
          configuredSeverity === "error" ||
          configuredSeverity === "warn" ||
          configuredSeverity === "info"
            ? configuredSeverity
            : finding.severity,
      };
    });
  const summary = summarizeFindings(sorted, files.length, 0);
  const displayed =
    options.maxIssues === undefined ? sorted : sorted.slice(0, options.maxIssues);
  const result = { findings: sorted, summary };
  const format = options.format ?? "tree";
  const output =
    format === "compact"
      ? `${renderCompact(displayed)}\n`
      : format === "json"
        ? renderJson(root, result, options.maxIssues)
        : format === "github"
          ? `${renderGitHub(displayed)}\n`
          : format === "sarif"
            ? `${renderSarif(displayed)}\n`
            : renderTree(root, sorted, summary, options.maxIssues);
  return { output, exitCode: exitCodeForFindings(sorted, options.failOn) };
}
