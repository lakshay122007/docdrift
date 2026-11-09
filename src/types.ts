export type Severity = "error" | "warn" | "info";

export interface Location {
  file: string;
  line: number;
  column: number;
}

export interface Finding extends Location {
  rule: string;
  severity: Severity;
  message: string;
  data?: Record<string, unknown>;
}

export interface EnvRead extends Location {
  kind: "env-read";
  name: string;
  optional: boolean;
  public: boolean;
}

export interface EnvDeclaration extends Location {
  kind: "env-declaration";
  name: string;
  value: string | undefined;
  source: string;
}

export interface MarkdownLink extends Location {
  kind: "markdown-link";
  target: string;
  text: string;
  image: boolean;
}

export interface MarkdownHeading extends Location {
  kind: "markdown-heading";
  text: string;
  slug: string;
}

export interface ScriptReference extends Location {
  kind: "script-reference";
  command: string;
  script: string;
  workspace?: string;
}

export interface PathMention extends Location {
  kind: "path-mention";
  value: string;
}

export interface DynamicEnvAccess extends Location {
  kind: "env-dynamic-access";
  expression: string;
}

export interface ParseError extends Location {
  kind: "parse-error";
  message: string;
}

export type Fact =
  | EnvRead
  | EnvDeclaration
  | MarkdownLink
  | MarkdownHeading
  | ScriptReference
  | PathMention
  | DynamicEnvAccess
  | ParseError;

export interface Summary {
  errors: number;
  warnings: number;
  info: number;
  files: number;
  durationMs: number;
}

export interface RunResult {
  findings: Finding[];
  summary: Summary;
}

export interface RunOptions {
  root?: string;
  failOn?: Severity | "never";
}
