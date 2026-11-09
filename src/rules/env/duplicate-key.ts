import type { EnvDeclaration, Finding } from "../../types.js";
import { findingFromDeclaration } from "./common.js";

export function findDuplicateEnvKeys(declarations: EnvDeclaration[]): Finding[] {
  const seen = new Map<string, EnvDeclaration>();
  const findings: Finding[] = [];
  for (const declaration of declarations) {
    const key = `${declaration.file}\u0000${declaration.name}`;
    if (seen.has(key))
      findings.push(
        findingFromDeclaration(
          declaration,
          "env-duplicate-key",
          "warn",
          `${declaration.name} is declared more than once in this file`,
        ),
      );
    else seen.set(key, declaration);
  }
  return findings;
}
