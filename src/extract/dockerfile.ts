import type { EnvDeclaration } from "../types.js";

export function extractDockerfileEnv(text: string, file: string): EnvDeclaration[] {
  const declarations: EnvDeclaration[] = [];
  for (const [index, line] of text.split("\n").entries()) {
    const instruction = line.match(/^\s*(ENV|ARG)\s+(.+)$/i);
    if (!instruction) continue;
    for (const assignment of (instruction[2] ?? "").split(/\s+/)) {
      const [name, value] = assignment.split("=", 2);
      if (name)
        declarations.push({
          kind: "env-declaration",
          name,
          value,
          source: "dockerfile",
          file,
          line: index + 1,
          column: 1,
        });
    }
  }
  return declarations;
}
