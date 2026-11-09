import { readFile, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";
import ignore from "ignore";

const skippedDirectories = new Set(["node_modules", ".git", "dist", "build", "coverage"]);

export interface WalkOptions {
  ignorePatterns?: string[];
  useGitignore?: boolean;
}

async function readGitignore(root: string, useGitignore: boolean): Promise<string[]> {
  if (!useGitignore) {
    return [];
  }
  try {
    return (await readFile(resolve(root, ".gitignore"), "utf8")).split(/\r?\n/);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function walkFiles(
  root: string,
  options: WalkOptions = {},
): Promise<string[]> {
  const matcher = ignore();
  matcher.add(await readGitignore(root, options.useGitignore ?? true));
  matcher.add(options.ignorePatterns ?? []);
  const files: string[] = [];

  async function visit(directory: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return;
      }
      throw error;
    }

    for (const entry of entries) {
      const fullPath = resolve(directory, entry.name);
      const relativePath = relative(root, fullPath).replaceAll("\\", "/");
      if (entry.isSymbolicLink() || matcher.ignores(relativePath)) {
        continue;
      }
      if (entry.isDirectory()) {
        if (!skippedDirectories.has(entry.name)) {
          await visit(fullPath);
        }
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  await visit(root);
  return files.sort();
}
