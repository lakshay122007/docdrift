import { describe, expect, it } from "vitest";
import { scan } from "../../src/simple-scan.js";
describe("simple scan", () => {
  it("reports environment and documentation drift in the demo", async () => {
    const result = await scan("examples/demo-repo", "compact");
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("env-undocumented");
    expect(result.output).toContain("docs-link-broken-file");
  });
});
