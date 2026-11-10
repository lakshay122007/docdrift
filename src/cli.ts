#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { defaultConfig, ruleIds } from "./config/defaults.js";
import { DriftcheckError } from "./util/errors.js";
const packageFile = new URL("../package.json", import.meta.url);
async function readVersion(): Promise<string> {
  const data: unknown = JSON.parse(await readFile(packageFile, "utf8"));
  if (
    typeof data !== "object" ||
    data === null ||
    !("version" in data) ||
    typeof data.version !== "string"
  )
    throw new Error("package.json does not contain a string version");
  return data.version;
}
async function main(): Promise<void> {
  if (Number(process.versions.node.split(".")[0]) < 18)
    throw new DriftcheckError("driftcheck requires Node.js 18 or later");
  const parsed = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      version: { type: "boolean", short: "v" },
      help: { type: "boolean", short: "h" },
      quiet: { type: "boolean" },
      verbose: { type: "boolean" },
    },
  });
  if (parsed.values.quiet && parsed.values.verbose)
    throw new DriftcheckError("--quiet and --verbose cannot be used together");
  if (parsed.values.version) {
    console.log(await readVersion());
    return;
  }
  if (parsed.values.help) {
    console.log(
      "driftcheck [path] [options]\ndriftcheck check|env|docs [path]\ndriftcheck init|baseline|explain <rule-id>|rules",
    );
    return;
  }
  const command = parsed.positionals[0] ?? "check";
  if (command === "init") {
    await writeFile(
      "driftcheck.config.json",
      `${JSON.stringify(defaultConfig, null, 2)}\n`,
      { flag: "wx" },
    );
    console.log("created driftcheck.config.json");
    return;
  }
  if (command === "rules") {
    console.log(
      ruleIds.map((rule) => `${rule}\t${defaultConfig.rules[rule]}`).join("\n"),
    );
    return;
  }
  if (command === "explain") {
    const rule = parsed.positionals[1];
    if (!rule || !ruleIds.includes(rule as (typeof ruleIds)[number]))
      throw new DriftcheckError("explain requires a known rule id");
    console.log(`${rule}: see docs/rules/${rule}.md`);
    return;
  }
  if (!["check", "env", "docs", "fix", "baseline"].includes(command))
    throw new DriftcheckError(`Unknown command: ${command}`);
  console.log("nothing to scan");
}
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = error instanceof DriftcheckError ? error.exitCode : 3;
});
