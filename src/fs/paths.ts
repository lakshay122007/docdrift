import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export function toPosixPath(path: string): string {
  return path.replaceAll("\\", "/");
}

export function resolveFromRoot(root: string, path: string): string {
  return resolve(root, path.replaceAll("\\", "/"));
}

export async function findCaseMismatch(path: string): Promise<string | null> {
  const parent = dirname(path);
  const expectedName = path.slice(parent.length + 1);
  try {
    const names = await readdir(parent);
    const actualName = names.find(
      (name) => name.toLocaleLowerCase() === expectedName.toLocaleLowerCase(),
    );
    return actualName && actualName !== expectedName ? actualName : null;
  } catch {
    return null;
  }
}
