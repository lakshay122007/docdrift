import type { EnvDeclaration, Finding } from "../../types.js";
import { findingFromDeclaration } from "./common.js";

export function findEmptyRequiredEnv(declarations: EnvDeclaration[]): Finding[] {
  return declarations
    .filter((declaration) => declaration.source === "dotenv" && declaration.value === "")
    .map((declaration) =>
      findingFromDeclaration(
        declaration,
        "env-empty-required",
        "warn",
        `${declaration.name} has an empty required value`,
      ),
    );
}
