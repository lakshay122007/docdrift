#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const packageFile = new URL("../package.json", import.meta.url);

async function readVersion(): Promise<string> {
  const packageText = await readFile(packageFile, "utf8");
  const packageData: unknown = JSON.parse(packageText);

  if (
    typeof packageData !== "object" ||
    packageData === null ||
    !("version" in packageData) ||
    typeof packageData.version !== "string"
  ) {
    throw new Error("package.json does not contain a string version");
  }

  return packageData.version;
}

async function main(): Promise<void> {
  const version = await readVersion();
  if (process.argv.includes("--version") || process.argv.includes("-v")) {
    console.log(version);
  }
}

void main();
