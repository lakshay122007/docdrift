import { parseAllDocuments } from "yaml";

import type { EnvDeclaration } from "../types.js";

const expressionPattern = /\$\{\{\s*(?:secrets|vars)\.([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

function visit(
  value: unknown,
  declarations: EnvDeclaration[],
  file: string,
  inEnv = false,
): void {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, declarations, file, inEnv);
  } else if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      if (inEnv)
        declarations.push({
          kind: "env-declaration",
          name: key,
          value: typeof item === "string" ? item : undefined,
          source: "workflow",
          file,
          line: 1,
          column: 1,
        });
      visit(item, declarations, file, key === "env");
    }
  } else if (typeof value === "string") {
    for (const match of value.matchAll(expressionPattern)) {
      declarations.push({
        kind: "env-declaration",
        name: match[1] ?? "",
        value: undefined,
        source: "workflow",
        file,
        line: 1,
        column: 1,
      });
    }
  }
}

export function extractWorkflowEnv(text: string, file: string): EnvDeclaration[] {
  const declarations: EnvDeclaration[] = [];
  for (const document of parseAllDocuments(text)) {
    if (document.errors.length === 0) visit(document.toJS(), declarations, file);
  }
  return declarations;
}
