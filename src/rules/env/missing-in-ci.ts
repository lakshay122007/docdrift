import type { EnvDeclaration, EnvRead, Finding } from "../../types.js";
import { findingFromRead } from "./common.js";

export function findEnvMissingInCi(
  reads: EnvRead[],
  declarations: EnvDeclaration[],
): Finding[] {
  const ciNames = new Set(
    declarations
      .filter((declaration) => declaration.source === "workflow")
      .map((declaration) => declaration.name),
  );
  return reads
    .filter((read) => !read.optional && !ciNames.has(read.name))
    .map((read) =>
      findingFromRead(
        read,
        "env-missing-in-ci",
        "warn",
        `${read.name} is not declared in a workflow`,
      ),
    );
}
