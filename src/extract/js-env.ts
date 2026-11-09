import { parse } from "@babel/parser";

import type { DynamicEnvAccess, EnvRead, ParseError } from "../types.js";

export interface JavaScriptEnvResult {
  reads: EnvRead[];
  dynamicAccesses: DynamicEnvAccess[];
  parseErrors: ParseError[];
}

type Node = Record<string, unknown>;

function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null && "type" in value;
}

function nodeType(node: Node): string {
  return typeof node.type === "string" ? node.type : "";
}

function location(node: Node, file: string): Pick<EnvRead, "file" | "line" | "column"> {
  const start = isNode(node.loc) && isNode(node.loc.start) ? node.loc.start : {};
  return {
    file,
    line: typeof start.line === "number" ? start.line : 1,
    column: typeof start.column === "number" ? start.column + 1 : 1,
  };
}

function identifierName(node: unknown): string | undefined {
  return isNode(node) && nodeType(node) === "Identifier" && typeof node.name === "string"
    ? node.name
    : undefined;
}

function staticString(node: unknown): string | undefined {
  if (!isNode(node)) return undefined;
  if (
    (nodeType(node) === "StringLiteral" || nodeType(node) === "Literal") &&
    typeof node.value === "string"
  ) {
    return node.value;
  }
  if (nodeType(node) === "BinaryExpression" && node.operator === "+") {
    const left = staticString(node.left);
    const right = staticString(node.right);
    return left === undefined || right === undefined ? undefined : left + right;
  }
  return undefined;
}

function memberName(node: unknown): string | undefined {
  if (!isNode(node) || nodeType(node) !== "MemberExpression") return undefined;
  if (node.computed === true) return staticString(node.property);
  return identifierName(node.property);
}

function isProcessEnv(node: unknown): boolean {
  if (!isNode(node) || nodeType(node) !== "MemberExpression") return false;
  return identifierName(node.object) === "process" && memberName(node) === "env";
}

function isImportMetaEnv(node: unknown): boolean {
  if (!isNode(node) || nodeType(node) !== "MemberExpression") return false;
  return (
    isNode(node.object) &&
    nodeType(node.object) === "MetaProperty" &&
    memberName(node) === "env"
  );
}

function isBunEnv(node: unknown): boolean {
  return (
    isNode(node) &&
    nodeType(node) === "MemberExpression" &&
    identifierName(node.object) === "Bun" &&
    memberName(node) === "env"
  );
}

function isOptional(parent: Node | undefined): boolean {
  return (
    parent !== undefined &&
    (nodeType(parent) === "LogicalExpression" || nodeType(parent) === "AssignmentPattern")
  );
}

function addRead(
  reads: EnvRead[],
  name: string,
  node: Node,
  file: string,
  optional: boolean,
): void {
  reads.push({
    kind: "env-read",
    name,
    optional,
    public: /^(NEXT_PUBLIC_|VITE_|REACT_APP_|PUBLIC_|EXPO_PUBLIC_)/.test(name),
    ...location(node, file),
  });
}

function fallbackReads(text: string, file: string): EnvRead[] {
  const reads: EnvRead[] = [];
  for (const match of text.matchAll(/\bprocess\.env\.([A-Z][A-Z0-9_]*)/g)) {
    const before = text.slice(0, match.index ?? 0);
    const line = before.split("\n").length;
    addRead(reads, match[1] ?? "", { loc: { start: { line, column: 0 } } }, file, false);
  }
  return reads;
}

export function extractJavaScriptEnv(text: string, file: string): JavaScriptEnvResult {
  const reads: EnvRead[] = [];
  const dynamicAccesses: DynamicEnvAccess[] = [];
  const parseErrors: ParseError[] = [];
  let ast: unknown;
  try {
    ast = parse(text, {
      sourceType: "unambiguous",
      errorRecovery: true,
      plugins: ["jsx", "typescript", "decorators"],
    });
  } catch (error) {
    parseErrors.push({
      kind: "parse-error",
      message: error instanceof Error ? error.message : "parse error",
      file,
      line: 1,
      column: 1,
    });
    return { reads: fallbackReads(text, file), dynamicAccesses, parseErrors };
  }
  const aliases = new Set<string>();

  function visit(value: unknown, parent?: Node): void {
    if (!isNode(value)) {
      if (Array.isArray(value)) for (const item of value) visit(item, parent);
      return;
    }
    const type = nodeType(value);
    if (type === "VariableDeclarator" && isProcessEnv(value.init)) {
      const name = identifierName(value.id);
      if (name) aliases.add(name);
      if (
        isNode(value.id) &&
        nodeType(value.id) === "ObjectPattern" &&
        Array.isArray(value.id.properties)
      ) {
        for (const property of value.id.properties) {
          if (!isNode(property) || nodeType(property) !== "ObjectProperty") continue;
          const name = identifierName(property.key);
          if (name)
            addRead(
              reads,
              name,
              property,
              file,
              isNode(property.value) && nodeType(property.value) === "AssignmentPattern",
            );
        }
      }
    }
    if (type === "MemberExpression") {
      const object = value.object;
      const directEnv =
        isProcessEnv(object) || isImportMetaEnv(object) || isBunEnv(object);
      const aliasedEnv =
        identifierName(object) !== undefined && aliases.has(identifierName(object) ?? "");
      if (directEnv || aliasedEnv) {
        const name = memberName(value);
        if (name) {
          addRead(reads, name, value, file, isOptional(parent));
        } else {
          dynamicAccesses.push({
            kind: "env-dynamic-access",
            expression: "dynamic environment access",
            ...location(value, file),
          });
        }
      }
    }
    if (
      type === "CallExpression" &&
      isNode(value.callee) &&
      nodeType(value.callee) === "MemberExpression"
    ) {
      const callee = value.callee;
      const getsDenoEnv =
        isNode(callee.object) &&
        nodeType(callee.object) === "MemberExpression" &&
        identifierName(callee.object.object) === "Deno" &&
        memberName(callee.object) === "env" &&
        memberName(callee) === "get";
      if (getsDenoEnv) {
        const argument = Array.isArray(value.arguments) ? value.arguments[0] : undefined;
        const name = staticString(argument);
        if (name)
          addRead(
            reads,
            name,
            value,
            file,
            Array.isArray(value.arguments) && value.arguments.length > 1,
          );
        else
          dynamicAccesses.push({
            kind: "env-dynamic-access",
            expression: "Deno.env.get",
            ...location(value, file),
          });
      }
    }
    for (const child of Object.values(value)) {
      if (child !== value.loc) visit(child, value);
    }
  }

  visit(ast);
  return { reads, dynamicAccesses, parseErrors };
}
