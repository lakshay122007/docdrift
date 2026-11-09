import type { EnvDeclaration } from "../types.js";

const validKey = /^[A-Za-z_][A-Za-z0-9_]*$/;

export interface DotenvResult {
  declarations: EnvDeclaration[];
  invalidLines: number[];
}

export function extractDotenv(text: string, file: string): DotenvResult {
  const declarations: EnvDeclaration[] = [];
  const invalidLines: number[] = [];
  const lines = text.split("\n");
  let lineNumber = 0;

  while (lineNumber < lines.length) {
    const line = lines[lineNumber] ?? "";
    lineNumber += 1;
    const match = line.match(/^\s*(?:export\s+)?([^=\s#]+)(?:\s*=\s*(.*))?\s*$/);
    if (!match || line.trim() === "" || line.trimStart().startsWith("#")) continue;
    const key = match[1] ?? "";
    let value = match[2]?.trim();
    if (!validKey.test(key)) {
      invalidLines.push(lineNumber);
      continue;
    }
    if (value?.startsWith('"') || value?.startsWith("'")) {
      const quote = value[0] ?? "";
      while (!value.endsWith(quote) && lineNumber < lines.length) {
        value += `\n${lines[lineNumber] ?? ""}`;
        lineNumber += 1;
      }
      if (value.endsWith(quote)) value = value.slice(1, -1);
    } else if (value !== undefined) {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    declarations.push({
      kind: "env-declaration",
      name: key,
      value,
      source: "dotenv",
      file,
      line: lineNumber,
      column: 1,
    });
  }
  return { declarations, invalidLines };
}
