import type { EnvDeclaration, Finding } from "../../types.js";
import { findingFromDeclaration } from "./common.js";

export function findEnvNotInDocs(
  declarations: EnvDeclaration[],
  documentedNames: Set<string>,
): Finding[] {
  return declarations
    .filter(
      (declaration) =>
        declaration.source === "dotenv" && !documentedNames.has(declaration.name),
    )
    .map((declaration) =>
      findingFromDeclaration(
        declaration,
        "env-not-in-docs",
        "warn",
        `${declaration.name} is not mentioned in documentation`,
      ),
    );
}
