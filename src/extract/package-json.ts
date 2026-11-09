import { readFile } from "node:fs/promises";

export async function readPackageScripts(file: string): Promise<Record<string, string>> {
  try {
    const data: unknown = JSON.parse(await readFile(file, "utf8"));
    if (
      typeof data !== "object" ||
      data === null ||
      !("scripts" in data) ||
      typeof data.scripts !== "object" ||
      data.scripts === null
    )
      return {};
    return Object.fromEntries(
      Object.entries(data.scripts).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}
