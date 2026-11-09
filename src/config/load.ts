import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { DocdriftError } from "../util/errors.js";
import { mergeConfig, validateConfig, type DocdriftConfig } from "./schema.js";

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function readJson(file: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    throw new DocdriftError(
      `Could not parse ${file}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function loadConfig(
  root: string,
  explicitFile?: string,
): Promise<DocdriftConfig> {
  const candidates = explicitFile
    ? [resolve(root, explicitFile)]
    : [resolve(root, "docdrift.config.json"), resolve(root, "docdrift.config.js")];

  for (const file of candidates) {
    if (!(await exists(file))) continue;
    const contents = file.endsWith(".js")
      ? (await import(pathToFileURL(file).href)).default
      : await readJson(file);
    return mergeConfig(validateConfig(contents));
  }

  const packageFile = resolve(root, "package.json");
  if (await exists(packageFile)) {
    const packageData = await readJson(packageFile);
    if (
      typeof packageData === "object" &&
      packageData !== null &&
      "docdrift" in packageData
    ) {
      return mergeConfig(validateConfig(packageData.docdrift));
    }
  }
  return mergeConfig({});
}
