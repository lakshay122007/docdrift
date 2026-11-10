import { describe, expect, it } from "vitest";
import { scan } from "../../src/simple-scan.js";
describe("simple scan", () => {
  it("reports environment and documentation drift in the demo", async () => {
    const result = await scan("examples/demo-repo", { format: "compact" });
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("env-undocumented");
    expect(result.output).toContain("docs-link-broken-file");
  });
  it("filters checks by command mode and supports JSON output", async () => {
    const env = await scan("examples/demo-repo", { mode: "env", format: "compact" });
    expect(env.output).toContain("env-undocumented");
    expect(env.output).not.toContain("docs-link-broken-file");
    const json = await scan("examples/demo-repo", {
      format: "json",
      maxIssues: 1,
      failOn: "never",
    });
    expect(JSON.parse(json.output).findings).toHaveLength(1);
    expect(json.exitCode).toBe(0);
  });
});
