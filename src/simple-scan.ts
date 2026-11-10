import { basename, relative, resolve } from "node:path";

import { loadConfig } from "./config/load.js";
import { extractDotenv } from "./extract/dotenv.js";
import { extractJavaScriptEnv } from "./extract/js-env.js";
import { extractMarkdown } from "./extract/markdown.js";
import { findRoot } from "./fs/root.js";
import { readTextFile } from "./fs/read.js";
import { walkFiles } from "./fs/walk.js";
import { renderCompact } from "./report/compact.js";
import { renderTree } from "./report/tree.js";
import { findBrokenLinks } from "./rules/docs/link.js";
import { findMissingScripts } from "./rules/docs/script.js";
import { findDuplicateEnvKeys } from "./rules/env/duplicate-key.js";
import { findUndocumentedEnv } from "./rules/env/undocumented.js";
import { findUnusedEnv } from "./rules/env/unused.js";
import { sortAndDedupeFindings, summarizeFindings } from "./run.js";
import type {
  EnvDeclaration,
  EnvRead,
  Finding,
  MarkdownHeading,
  MarkdownLink,
  ScriptReference,
} from "./types.js";
import { readPackageScripts } from "./extract/package-json.js";

export async function scan(
  path: string,
  format = "tree",
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
    if (["md", "markdown", "mdx"].includes(extension ?? "")) {
      const result = extractMarkdown(content.text, file);
      headings.push(...result.headings);
      links.push(...result.links);
      scripts.push(...result.scripts);
    }
  }
  findings.push(...findUndocumentedEnv(reads, declarations, config.env));
  findings.push(...findUnusedEnv(declarations, reads, config.env));
  findings.push(...findDuplicateEnvKeys(declarations));
  findings.push(...(await findBrokenLinks(root, links, headings)));
  findings.push(
    ...findMissingScripts(
      scripts,
      await readPackageScripts(resolve(root, "package.json")),
    ),
  );
  const sorted = sortAndDedupeFindings(findings);
  const summary = summarizeFindings(sorted, files.length, 0);
  const output =
    format === "compact"
      ? `${renderCompact(sorted)}\n`
      : renderTree(root, sorted, summary);
  return { output, exitCode: summary.errors > 0 ? 1 : 0 };
}
