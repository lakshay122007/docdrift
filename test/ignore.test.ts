import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { filterBaseline, writeBaseline } from "../src/ignore/baseline.js";
import { filterInlineIgnores } from "../src/ignore/directives.js";
import type { Finding } from "../src/types.js";
const finding: Finding = {
  rule: "env-undocumented",
  severity: "error",
  message: "KEY is missing",
  file: "src/a.ts",
  line: 2,
  column: 1,
};
describe("ignores", () => {
  it("hides a baselined finding after its line changes", async () => {
    const file = join(await mkdtemp(join(tmpdir(), "driftcheck-base-")), "baseline.json");
    await writeBaseline(file, [finding]);
    const changed = { ...finding, line: 20 };
    await expect(filterBaseline(file, [changed])).resolves.toMatchObject({
      findings: [],
      hidden: 1,
    });
  });
  it("keeps new baseline findings visible", async () => {
    const file = join(await mkdtemp(join(tmpdir(), "driftcheck-base-")), "baseline.json");
    await writeBaseline(file, [finding]);
    await expect(
      filterBaseline(file, [{ ...finding, message: "OTHER is missing" }]),
    ).resolves.toMatchObject({ hidden: 0 });
  });
  it("filters a next-line inline directive", () => {
    expect(
      filterInlineIgnores(
        "// docdrift-ignore-next-line env-undocumented\nprocess.env.KEY",
        [finding],
      ),
    ).toEqual([]);
  });
});
