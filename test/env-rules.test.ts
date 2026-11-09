import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { appendMissingEnvKeys } from "../src/fix/env-example.js";
import { findDuplicateEnvKeys } from "../src/rules/env/duplicate-key.js";
import { findEmptyRequiredEnv } from "../src/rules/env/empty-required.js";
import { findUndocumentedEnv } from "../src/rules/env/undocumented.js";
import { findUnusedEnv } from "../src/rules/env/unused.js";
import type { EnvDeclaration, EnvRead } from "../src/types.js";

const read = (name: string, optional = false): EnvRead => ({
  kind: "env-read",
  name,
  optional,
  public: false,
  file: "src/app.ts",
  line: 1,
  column: 1,
});
const declaration = (name: string, value = "value"): EnvDeclaration => ({
  kind: "env-declaration",
  name,
  value,
  source: "dotenv",
  file: ".env.example",
  line: 1,
  column: 1,
});

describe("environment rules", () => {
  it("reports undocumented reads and lowers optional reads to warnings", () => {
    expect(
      findUndocumentedEnv([read("MISSING"), read("OPTIONAL", true)], [], {
        optionalAsWarn: true,
      }).map((finding) => finding.severity),
    ).toEqual(["error", "warn"]);
    expect(findUndocumentedEnv([read("NODE_ENV")], [], { optionalAsWarn: true })).toEqual(
      [],
    );
  });
  it("reports declarations that are unused and stays quiet when read", () => {
    expect(findUnusedEnv([declaration("OLD")], [])).toHaveLength(1);
    expect(findUnusedEnv([declaration("USED")], [read("USED")])).toEqual([]);
  });
  it("reports duplicate and empty keys", () => {
    expect(findDuplicateEnvKeys([declaration("DUP"), declaration("DUP")])).toHaveLength(
      1,
    );
    expect(findEmptyRequiredEnv([declaration("EMPTY", "")])).toHaveLength(1);
  });
  it("appends only missing keys and preserves CRLF in dry-run mode", async () => {
    const root = await mkdtemp(join(tmpdir(), "driftcheck-fix-"));
    const file = join(root, ".env.example");
    await writeFile(file, "PRESENT=value\r\n");
    const result = await appendMissingEnvKeys(file, ["PRESENT", "MISSING"], {
      dryRun: true,
    });
    expect(result.output).toContain("MISSING=\r\n");
    expect(await readFile(file, "utf8")).toBe("PRESENT=value\r\n");
  });
});
