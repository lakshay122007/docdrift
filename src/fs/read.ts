import { readFile, stat } from "node:fs/promises";

const maximumFileSize = 1024 * 1024;

export interface ReadResult {
  text: string | null;
  skipReason?: string;
}

function isBinary(buffer: Buffer): boolean {
  return buffer.includes(0);
}

export async function readTextFile(file: string): Promise<ReadResult> {
  try {
    const metadata = await stat(file);
    if (metadata.size > maximumFileSize) {
      return { text: null, skipReason: "file exceeds 1 MB" };
    }
    const buffer = await readFile(file);
    if (isBinary(buffer)) {
      return { text: null, skipReason: "binary file" };
    }
    return {
      text: buffer
        .toString("utf8")
        .replace(/^\uFEFF/, "")
        .replaceAll("\r\n", "\n"),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "ENOENT" || error.code === "EACCES")
    ) {
      return { text: null, skipReason: error.code.toLowerCase() };
    }
    throw new Error(
      `Could not read ${file}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}
