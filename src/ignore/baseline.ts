import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import type { Finding } from "../types.js";

interface Baseline {
  hashes: string[];
}

export function baselineHash(finding: Finding): string {
  return createHash("sha256")
    .update(`${finding.rule}\0${finding.file}\0${finding.message.replace(/\d+/g, "#")}`)
    .digest("hex");
}

export async function writeBaseline(file: string, findings: Finding[]): Promise<void> {
  await writeFile(
    file,
    `${JSON.stringify({ hashes: findings.map(baselineHash) }, null, 2)}\n`,
  );
}

export async function filterBaseline(
  file: string,
  findings: Finding[],
): Promise<{ findings: Finding[]; hidden: number }> {
  const baseline: Baseline = JSON.parse(await readFile(file, "utf8"));
  const hashes = new Set(baseline.hashes);
  const visible = findings.filter((finding) => !hashes.has(baselineHash(finding)));
  return { findings: visible, hidden: findings.length - visible.length };
}
