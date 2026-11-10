import { access, stat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

export interface LinkTarget {
  path: string;
  anchor?: string;
  outsideRoot: boolean;
}

export function resolveLinkTarget(
  root: string,
  sourceFile: string,
  target: string,
): LinkTarget | null {
  if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(target)) return null;
  const [pathAndQuery, anchor] = target.split("#", 2);
  const pathPart = (pathAndQuery ?? "").split("?", 1)[0] ?? "";
  const base = pathPart.startsWith("/") ? root : dirname(sourceFile);
  const path = pathPart === "" ? sourceFile : resolve(base, decodeURIComponent(pathPart));
  return { path, anchor, outsideRoot: relative(root, path).startsWith("..") };
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function resolveDirectoryTarget(path: string): Promise<string> {
  try {
    if (!(await stat(path)).isDirectory()) return path;
    for (const name of ["README.md", "index.md"]) {
      const candidate = resolve(path, name);
      if (await pathExists(candidate)) return candidate;
    }
  } catch {
    return path;
  }
  return path;
}
