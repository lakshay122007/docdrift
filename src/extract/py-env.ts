import type { DynamicEnvAccess, EnvRead } from "../types.js";

export function extractPythonEnv(
  text: string,
  file: string,
): { reads: EnvRead[]; dynamicAccesses: DynamicEnvAccess[] } {
  const reads: EnvRead[] = [];
  const dynamicAccesses: DynamicEnvAccess[] = [];
  for (const [index, line] of text.split("\n").entries()) {
    const clean = line.replace(/#.*/, "");
    for (const match of clean.matchAll(
      /os\.(?:environ\[|environ\.get\(|getenv\()(["'])([A-Za-z_][A-Za-z0-9_]*)\1/g,
    ))
      reads.push({
        kind: "env-read",
        name: match[2] ?? "",
        optional: /,\s*[^)]/.test(clean),
        public: false,
        file,
        line: index + 1,
        column: (match.index ?? 0) + 1,
      });
    if (/os\.(?:environ\[|environ\.get\(|getenv\()(?!(?:["']))/.test(clean))
      dynamicAccesses.push({
        kind: "env-dynamic-access",
        expression: "dynamic Python environment access",
        file,
        line: index + 1,
        column: 1,
      });
  }
  return { reads, dynamicAccesses };
}
