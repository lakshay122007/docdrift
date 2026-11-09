import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { findCaseMismatch, toPosixPath } from "../src/fs/paths.js";
import { readTextFile } from "../src/fs/read.js";
import { findRoot } from "../src/fs/root.js";
import { walkFiles } from "../src/fs/walk.js";

async function temporaryDirectory(): Promise<string> {
  return mkdtemp(join(tmpdir(), "driftcheck-"));
}

describe("filesystem layer", () => {
  it("finds the nearest project root", async () => {
    const root = await temporaryDirectory();
    await mkdir(join(root, "nested", "child"), { recursive: true });
    await writeFile(join(root, "package.json"), "{}");
    await expect(findRoot(join(root, "nested", "child"))).resolves.toBe(root);
  });

  it("walks files without following a symlink loop", async () => {
    const root = await temporaryDirectory();
    await mkdir(join(root, "nested"));
    await writeFile(join(root, "nested", "file.md"), "text");
    await symlink(root, join(root, "nested", "loop"));
    await expect(walkFiles(root)).resolves.toEqual([join(root, "nested", "file.md")]);
  });

  it("honors gitignore patterns", async () => {
    const root = await temporaryDirectory();
    await writeFile(join(root, ".gitignore"), "ignored.md\n");
    await writeFile(join(root, "ignored.md"), "hidden");
    await writeFile(join(root, "readme.md"), "shown");
    await expect(walkFiles(root)).resolves.toEqual([
      join(root, ".gitignore"),
      join(root, "readme.md"),
    ]);
  });

  it("normalizes a BOM and CRLF text file", async () => {
    const root = await temporaryDirectory();
    const file = join(root, "crlf-bom.txt");
    await writeFile(file, "\uFEFFfirst\r\nsecond\r\n");
    await expect(readTextFile(file)).resolves.toEqual({ text: "first\nsecond\n" });
  });

  it("skips binary and large files", async () => {
    const root = await temporaryDirectory();
    const binary = join(root, "binary.bin");
    const large = join(root, "large.txt");
    await writeFile(binary, Buffer.from([0, 1]));
    await writeFile(large, "x".repeat(1024 * 1024 + 1));
    await expect(readTextFile(binary)).resolves.toMatchObject({
      skipReason: "binary file",
    });
    await expect(readTextFile(large)).resolves.toMatchObject({
      skipReason: "file exceeds 1 MB",
    });
  });

  it("uses posix paths and reports case mismatches", async () => {
    const root = await temporaryDirectory();
    await writeFile(join(root, "Readme.md"), "text");
    expect(toPosixPath("docs\\guide.md")).toBe("docs/guide.md");
    await expect(findCaseMismatch(join(root, "README.md"))).resolves.toBe("Readme.md");
  });
});
