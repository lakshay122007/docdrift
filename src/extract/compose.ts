import { parseAllDocuments } from "yaml";

import type { EnvDeclaration } from "../types.js";

function collectEnvironment(
  value: unknown,
  declarations: EnvDeclaration[],
  file: string,
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item !== "string") continue;
      const [name, valuePart] = item.split("=", 2);
      if (name)
        declarations.push({
          kind: "env-declaration",
          name,
          value: valuePart,
          source: "compose",
          file,
          line: 1,
          column: 1,
        });
    }
  } else if (typeof value === "object" && value !== null) {
    for (const [name, valuePart] of Object.entries(value)) {
      declarations.push({
        kind: "env-declaration",
        name,
        value: typeof valuePart === "string" ? valuePart : undefined,
        source: "compose",
        file,
        line: 1,
        column: 1,
      });
    }
  }
}

export function extractComposeEnv(text: string, file: string): EnvDeclaration[] {
  const declarations: EnvDeclaration[] = [];
  for (const document of parseAllDocuments(text)) {
    if (document.errors.length > 0) continue;
    const data = document.toJS();
    if (typeof data !== "object" || data === null) continue;
    const services =
      "services" in data && typeof data.services === "object" && data.services !== null
        ? data.services
        : {};
    for (const service of Object.values(services)) {
      if (typeof service !== "object" || service === null) continue;
      if ("environment" in service)
        collectEnvironment(service.environment, declarations, file);
    }
  }
  return declarations;
}
