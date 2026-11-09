import type { EnvDeclaration, EnvRead, Finding } from "../../types.js";
import { findingFromDeclaration, isIgnored } from "./common.js";

export function findUnusedEnv(
  declarations: EnvDeclaration[],
  reads: EnvRead[],
  options: { ignoreVars?: string[]; ignorePrefixes?: string[] } = {},
): Finding[] {
  const readNames = new Set(reads.map((read) => read.name));
  return declarations
    .filter(
      (declaration) =>
        declaration.source === "dotenv" &&
        !readNames.has(declaration.name) &&
        !isIgnored(declaration.name, options.ignoreVars, options.ignorePrefixes),
    )
    .map((declaration) =>
      findingFromDeclaration(
        declaration,
        "env-unused",
        "warn",
        `${declaration.name} is declared but never read`,
      ),
    );
}
