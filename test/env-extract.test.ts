import { describe, expect, it } from "vitest";

import { extractComposeEnv } from "../src/extract/compose.js";
import { extractDockerfileEnv } from "../src/extract/dockerfile.js";
import { extractDotenv } from "../src/extract/dotenv.js";
import { extractJavaScriptEnv } from "../src/extract/js-env.js";
import { extractWorkflowEnv } from "../src/extract/workflow.js";

describe("environment extractors", () => {
  it("extracts dotenv keys, empty values, exports, and duplicate keys", () => {
    const result = extractDotenv(
      "A=one\nexport B=two # comment\nEMPTY=\nA=again",
      ".env.example",
    );
    expect(result.declarations.map((item) => item.name)).toEqual([
      "A",
      "B",
      "EMPTY",
      "A",
    ]);
  });

  it("extracts JavaScript environment access without strings or comments", () => {
    const result = extractJavaScriptEnv(
      `// process.env.COMMENT\nconst value = process.env.KEY ?? "fallback"; const { RENAME: local, DEFAULT = "x" } = process.env; const env = process.env; env.ALIAS; import.meta.env.VITE_KEY; Deno.env.get("DENO"); Bun.env.BUN;`,
      "src/app.ts",
    );
    expect(result.reads.map((item) => item.name)).toEqual([
      "KEY",
      "RENAME",
      "DEFAULT",
      "ALIAS",
      "VITE_KEY",
      "DENO",
      "BUN",
    ]);
    expect(result.reads.find((item) => item.name === "KEY")?.optional).toBe(true);
  });

  it("reports dynamic JavaScript environment access", () => {
    expect(
      extractJavaScriptEnv("process.env[name]", "src/app.js").dynamicAccesses,
    ).toHaveLength(1);
  });

  it("falls back after a syntax error", () => {
    const result = extractJavaScriptEnv("process.env.KNOWN; function {", "src/broken.js");
    expect(result.parseErrors).toHaveLength(1);
    expect(result.reads.map((item) => item.name)).toEqual(["KNOWN"]);
  });

  it("extracts Compose, Dockerfile, and workflow declarations", () => {
    expect(
      extractComposeEnv(
        "services:\n  app:\n    environment:\n      FIRST: value\n      SECOND: two",
        "compose.yml",
      ).map((item) => item.name),
    ).toContain("FIRST");
    expect(
      extractComposeEnv(
        "services:\n  app:\n    environment:\n      - THIRD=three",
        "compose.yml",
      ).map((item) => item.name),
    ).toContain("THIRD");
    expect(
      extractDockerfileEnv("ENV FIRST=one SECOND=two\nARG THIRD", "Dockerfile").map(
        (item) => item.name,
      ),
    ).toEqual(["FIRST", "SECOND", "THIRD"]);
    expect(
      extractWorkflowEnv(
        "env:\n  FIRST: value\njobs:\n  test:\n    steps:\n      - run: echo '${{ secrets.SECRET }}'",
        "ci.yml",
      ).map((item) => item.name),
    ).toContain("SECRET");
  });
});
