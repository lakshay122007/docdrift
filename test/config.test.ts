import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { loadConfig } from "../src/config/load.js";
import { validateConfig } from "../src/config/schema.js";
import { DriftcheckError } from "../src/util/errors.js";

async function temporaryDirectory(): Promise<string> {
  return mkdtemp(join(tmpdir(), "driftcheck-config-"));
}

describe("configuration", () => {
  it("merges a valid partial config with defaults", () => {
    expect(validateConfig({ env: { requireDocs: true } })).toMatchObject({
      env: { requireDocs: true, optionalAsWarn: true },
    });
  });

  it("rejects unknown keys", () => {
    expect(() => validateConfig({ wrong: true })).toThrow("Unknown config key: wrong");
  });

  it("rejects wrong value types", () => {
    expect(() => validateConfig({ env: { includeLocal: "yes" } })).toThrow(
      "Expected env.includeLocal to be a boolean",
    );
  });

  it("rejects unknown rule ids", () => {
    expect(() => validateConfig({ rules: { "not-a-rule": "warn" } })).toThrow(
      "Unknown rule id: rules.not-a-rule",
    );
  });

  it("uses defaults when config is missing", async () => {
    const root = await temporaryDirectory();
    await expect(loadConfig(root)).resolves.toMatchObject({
      env: { optionalAsWarn: true },
    });
  });

  it("rejects invalid JSON", async () => {
    const root = await temporaryDirectory();
    await writeFile(join(root, "driftcheck.config.json"), "{");
    await expect(loadConfig(root)).rejects.toBeInstanceOf(DriftcheckError);
  });
});
