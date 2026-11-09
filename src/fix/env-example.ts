import { access, readFile, writeFile } from "node:fs/promises";

export interface EnvExampleFixResult {
  changed: boolean;
  output: string;
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

export async function appendMissingEnvKeys(
  file: string,
  keys: string[],
  options: { dryRun?: boolean; create?: boolean } = {},
): Promise<EnvExampleFixResult> {
  const fileExists = await exists(file);
  if (!fileExists && !options.create)
    throw new Error(`${file} does not exist. Use --create to create it.`);
  const original = fileExists ? await readFile(file, "utf8") : "";
  const lineEnding = original.includes("\r\n") ? "\r\n" : "\n";
  const declared = new Set(
    [...original.matchAll(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)].map(
      (match) => match[1] ?? "",
    ),
  );
  const missing = keys.filter((key) => !declared.has(key));
  if (missing.length === 0) return { changed: false, output: original };
  const separator = original === "" || original.endsWith("\n") ? "" : lineEnding;
  const addition =
    ["# Added by driftcheck", ...missing.map((key) => `${key}=`)].join(lineEnding) +
    lineEnding;
  const output = `${original}${separator}${addition}`;
  if (!options.dryRun) await writeFile(file, output);
  return { changed: true, output };
}
