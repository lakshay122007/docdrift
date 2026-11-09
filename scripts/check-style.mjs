import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const bannedProse = [
  "seamless",
  "robust",
  "powerful",
  "comprehensive",
  "leverage",
  "utilize",
  "cutting-edge",
  "dive into",
  "delve",
  "it's worth noting",
  "in today's",
  "game-changer",
  "elevate",
  "streamline",
];
const sourceChecks = [
  { pattern: /\bany\b/, message: "contains any" },
  { pattern: /@ts-ignore/, message: "contains @ts-ignore" },
  { pattern: /\bTODO\b/, message: "contains TODO" },
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(file)));
    } else {
      files.push(file);
    }
  }
  return files;
}

function isAllowedConsoleFile(file) {
  const posixFile = file.replaceAll("\\", "/");
  return posixFile === "src/cli.ts" || posixFile.startsWith("src/report/");
}

async function checkSourceFiles() {
  const failures = [];
  let sourceFiles = [];
  try {
    sourceFiles = (await listFiles("src")).filter((file) => file.endsWith(".ts"));
  } catch (error) {
    if (error && error.code !== "ENOENT") {
      throw error;
    }
  }

  for (const file of sourceFiles) {
    const text = await readFile(file, "utf8");
    const displayFile = relative(process.cwd(), file);
    if (!isAllowedConsoleFile(displayFile) && /\bconsole\./.test(text)) {
      failures.push(`${displayFile} contains console output outside a reporter or CLI`);
    }
    for (const check of sourceChecks) {
      if (check.pattern.test(text)) {
        failures.push(`${displayFile} ${check.message}`);
      }
    }
  }
  return failures;
}

async function checkProseFiles() {
  const failures = [];
  const files = [];
  try {
    files.push("README.md");
    files.push(...(await listFiles("docs")).filter((file) => file.endsWith(".md")));
  } catch (error) {
    if (error && error.code !== "ENOENT") {
      throw error;
    }
  }

  for (const file of files) {
    try {
      const text = await readFile(file, "utf8");
      const lowerText = text.toLowerCase();
      for (const phrase of bannedProse) {
        if (lowerText.includes(phrase)) {
          failures.push(`${file} contains banned prose: ${phrase}`);
        }
      }
      if (text.includes("—")) {
        failures.push(`${file} contains an em dash`);
      }
    } catch (error) {
      if (!error || error.code !== "ENOENT") {
        throw error;
      }
    }
  }
  return failures;
}

const failures = [...(await checkSourceFiles()), ...(await checkProseFiles())];
if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
}
