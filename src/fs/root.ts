import { access } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const rootMarkers = [
  "driftcheck.config.json",
  "driftcheck.config.js",
  "package.json",
  ".git",
];

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function findRoot(startPath: string): Promise<string> {
  let directory = resolve(startPath);

  while (true) {
    for (const marker of rootMarkers) {
      if (await exists(resolve(directory, marker))) {
        return directory;
      }
    }
    const parent = dirname(directory);
    if (parent === directory) {
      return resolve(startPath);
    }
    directory = parent;
  }
}
