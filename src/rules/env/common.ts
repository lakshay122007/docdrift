import type {
  DynamicEnvAccess,
  EnvDeclaration,
  EnvRead,
  Finding,
  Severity,
} from "../../types.js";

const ignoredNames = new Set([
  "NODE_ENV",
  "CI",
  "HOME",
  "PATH",
  "PWD",
  "SHELL",
  "USER",
  "TZ",
  "LANG",
  "TMPDIR",
  "TEMP",
  "TMP",
  "DEBUG",
  "FORCE_COLOR",
  "NO_COLOR",
  "NETLIFY",
  "PORT",
]);
const ignoredPrefixes = [
  "npm_",
  "GITHUB_",
  "RUNNER_",
  "VERCEL_",
  "HEROKU_",
  "AWS_LAMBDA_",
];

export function isIgnored(
  name: string,
  extraNames: string[] = [],
  extraPrefixes: string[] = [],
): boolean {
  return (
    ignoredNames.has(name) ||
    [...ignoredPrefixes, ...extraPrefixes].some((prefix) => name.startsWith(prefix)) ||
    extraNames.includes(name)
  );
}

export function findingFromRead(
  read: EnvRead,
  rule: string,
  severity: Severity,
  message: string,
): Finding {
  return {
    rule,
    severity,
    message,
    file: read.file,
    line: read.line,
    column: read.column,
    data: { name: read.name, optional: read.optional, public: read.public },
  };
}

export function findingFromDeclaration(
  declaration: EnvDeclaration,
  rule: string,
  severity: Severity,
  message: string,
): Finding {
  return {
    rule,
    severity,
    message,
    file: declaration.file,
    line: declaration.line,
    column: declaration.column,
    data: { name: declaration.name },
  };
}

export function dynamicFinding(access: DynamicEnvAccess): Finding {
  return {
    rule: "env-dynamic-access",
    severity: "info",
    message: "environment key is dynamic and cannot be resolved",
    file: access.file,
    line: access.line,
    column: access.column,
  };
}
