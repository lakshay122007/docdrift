import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config/load.js";
import { validateConfig } from "../../src/config/schema.js";
import { DriftcheckError } from "../../src/util/errors.js";

const root = () => mkdtemp(join(tmpdir(), "driftcheck-config-unit-"));

describe("config load and validate", () => {
  it("reports unknown config keys with exit code 2", () => {
    try {
      validateConfig({ env: { unknown: true } });
    } catch (error) {
      expect(error).toMatchObject({
        exitCode: 2,
        message: "Unknown config key: env.unknown",
      });
      return;
    }
    throw new Error("expected error");
  });
  it("reports wrong config types with exit code 2", () => {
    try {
      validateConfig({ docs: { files: "bad" } });
    } catch (error) {
      expect(error).toMatchObject({
        exitCode: 2,
        message: "Expected docs.files to be an array of strings",
      });
      return;
    }
    throw new Error("expected error");
  });
  it("loads config from package.json", async () => {
    const directory = await root();
    await writeFile(
      join(directory, "package.json"),
      JSON.stringify({ driftcheck: { env: { includeLocal: true } } }),
    );
    await expect(loadConfig(directory)).resolves.toMatchObject({
      env: { includeLocal: true },
    });
  });
  it("reports missing explicit config with exit code 2", async () => {
    const directory = await root();
    await expect(loadConfig(directory, "missing.json")).rejects.toMatchObject({
      exitCode: 2,
      message: "Config file not found: missing.json",
    });
  });
  it("rejects invalid JSON with exit code 2", async () => {
    const directory = await root();
    await writeFile(join(directory, "driftcheck.config.json"), "{");
    await expect(loadConfig(directory)).rejects.toBeInstanceOf(DriftcheckError);
  });
});
