import type { EnvDeclaration, EnvRead, Finding } from "../../types.js";
import { findingFromRead, isIgnored } from "./common.js";

export function findUndocumentedEnv(
  reads: EnvRead[],
  declarations: EnvDeclaration[],
  options: { optionalAsWarn: boolean; ignoreVars?: string[]; ignorePrefixes?: string[] },
): Finding[] {
  const declared = new Set(declarations.map((declaration) => declaration.name));
  return reads
    .filter(
      (read) =>
        !declared.has(read.name) &&
        !isIgnored(read.name, options.ignoreVars, options.ignorePrefixes),
    )
    .map((read) =>
      findingFromRead(
        read,
        "env-undocumented",
        read.optional && options.optionalAsWarn ? "warn" : "error",
        `${read.name} is read in code but is not declared`,
      ),
    );
}
