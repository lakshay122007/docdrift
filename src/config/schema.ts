import { DocdriftError } from "../util/errors.js";
import { defaultConfig, ruleIds, type RuleId } from "./defaults.js";

export type RuleSeverity = "error" | "warn" | "info" | "off";
export type RuleSeverityMap = Record<RuleId, RuleSeverity>;

export interface DocdriftConfig {
  include: string[];
  ignore: string[];
  rules: RuleSeverityMap;
  env: {
    declarationFiles: string[];
    ignoreVars: string[];
    ignorePrefixes: string[];
    requireDocs: boolean;
    includeLocal: boolean;
    optionalAsWarn: boolean;
    languages: string[];
  };
  docs: {
    files: string[];
    entryPoints: string[];
    ignorePaths: string[];
    ignoreLinks: string[];
    allowExtensionless: boolean;
    checkExternal: boolean;
  };
}

const topLevelKeys = new Set(["include", "ignore", "rules", "env", "docs"]);
const envKeys = new Set([
  "declarationFiles",
  "ignoreVars",
  "ignorePrefixes",
  "requireDocs",
  "includeLocal",
  "optionalAsWarn",
  "languages",
]);
const docsKeys = new Set([
  "files",
  "entryPoints",
  "ignorePaths",
  "ignoreLinks",
  "allowExtensionless",
  "checkExternal",
]);
const severities = new Set<RuleSeverity>(["error", "warn", "info", "off"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateKeys(
  value: Record<string, unknown>,
  allowed: Set<string>,
  path: string,
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new DocdriftError(`Unknown config key: ${path}${key}`);
    }
  }
}

function validateStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new DocdriftError(`Expected ${path} to be an array of strings`);
  }
  return value;
}

function validateBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw new DocdriftError(`Expected ${path} to be a boolean`);
  }
  return value;
}

export function validateConfig(input: unknown): Partial<DocdriftConfig> {
  if (!isRecord(input)) {
    throw new DocdriftError("Expected config to be an object");
  }
  validateKeys(input, topLevelKeys, "");
  const config: Partial<DocdriftConfig> = {};

  if ("include" in input) config.include = validateStringArray(input.include, "include");
  if ("ignore" in input) config.ignore = validateStringArray(input.ignore, "ignore");
  if ("rules" in input) {
    if (!isRecord(input.rules)) throw new DocdriftError("Expected rules to be an object");
    const rules: Partial<RuleSeverityMap> = {};
    for (const [rule, severity] of Object.entries(input.rules)) {
      if (!ruleIds.includes(rule as RuleId))
        throw new DocdriftError(`Unknown rule id: rules.${rule}`);
      if (typeof severity !== "string" || !severities.has(severity as RuleSeverity)) {
        throw new DocdriftError(`Expected rules.${rule} to be a valid severity`);
      }
      rules[rule as RuleId] = severity as RuleSeverity;
    }
    config.rules = { ...defaultConfig.rules, ...rules };
  }
  if ("env" in input) {
    if (!isRecord(input.env)) throw new DocdriftError("Expected env to be an object");
    validateKeys(input.env, envKeys, "env.");
    config.env = {
      ...defaultConfig.env,
      ...("declarationFiles" in input.env && {
        declarationFiles: validateStringArray(
          input.env.declarationFiles,
          "env.declarationFiles",
        ),
      }),
      ...("ignoreVars" in input.env && {
        ignoreVars: validateStringArray(input.env.ignoreVars, "env.ignoreVars"),
      }),
      ...("ignorePrefixes" in input.env && {
        ignorePrefixes: validateStringArray(
          input.env.ignorePrefixes,
          "env.ignorePrefixes",
        ),
      }),
      ...("requireDocs" in input.env && {
        requireDocs: validateBoolean(input.env.requireDocs, "env.requireDocs"),
      }),
      ...("includeLocal" in input.env && {
        includeLocal: validateBoolean(input.env.includeLocal, "env.includeLocal"),
      }),
      ...("optionalAsWarn" in input.env && {
        optionalAsWarn: validateBoolean(input.env.optionalAsWarn, "env.optionalAsWarn"),
      }),
      ...("languages" in input.env && {
        languages: validateStringArray(input.env.languages, "env.languages"),
      }),
    };
  }
  if ("docs" in input) {
    if (!isRecord(input.docs)) throw new DocdriftError("Expected docs to be an object");
    validateKeys(input.docs, docsKeys, "docs.");
    config.docs = {
      ...defaultConfig.docs,
      ...("files" in input.docs && {
        files: validateStringArray(input.docs.files, "docs.files"),
      }),
      ...("entryPoints" in input.docs && {
        entryPoints: validateStringArray(input.docs.entryPoints, "docs.entryPoints"),
      }),
      ...("ignorePaths" in input.docs && {
        ignorePaths: validateStringArray(input.docs.ignorePaths, "docs.ignorePaths"),
      }),
      ...("ignoreLinks" in input.docs && {
        ignoreLinks: validateStringArray(input.docs.ignoreLinks, "docs.ignoreLinks"),
      }),
      ...("allowExtensionless" in input.docs && {
        allowExtensionless: validateBoolean(
          input.docs.allowExtensionless,
          "docs.allowExtensionless",
        ),
      }),
      ...("checkExternal" in input.docs && {
        checkExternal: validateBoolean(input.docs.checkExternal, "docs.checkExternal"),
      }),
    };
  }
  return config;
}

export function mergeConfig(config: Partial<DocdriftConfig>): DocdriftConfig {
  return {
    ...defaultConfig,
    ...config,
    rules: { ...defaultConfig.rules, ...config.rules },
    env: { ...defaultConfig.env, ...config.env },
    docs: { ...defaultConfig.docs, ...config.docs },
  };
}
