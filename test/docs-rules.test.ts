import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findBrokenLinks } from "../src/rules/docs/link.js";
import { findMissingScripts } from "../src/rules/docs/script.js";
import type { MarkdownLink } from "../src/types.js";
const link = (target: string): MarkdownLink => ({
  kind: "markdown-link",
  target,
  text: "link",
  image: false,
  file: "README.md",
  line: 1,
  column: 1,
});
describe("docs rules", () => {
  it("reports a missing link and accepts an existing one", async () => {
    const root = await mkdtemp(join(tmpdir(), "driftcheck-docs-"));
    const readme = join(root, "README.md");
    await writeFile(readme, "# readme");
    const missing = await findBrokenLinks(
      root,
      [{ ...link("missing.md"), file: readme }],
      [],
    );
    expect(missing[0]?.rule).toBe("docs-link-broken-file");
    await writeFile(join(root, "guide.md"), "# guide");
    expect(
      await findBrokenLinks(root, [{ ...link("guide.md"), file: readme }], []),
    ).toEqual([]);
  });
  it("reports a script absent from package scripts", () => {
    expect(
      findMissingScripts(
        [
          {
            kind: "script-reference",
            command: "npm run seed",
            script: "seed",
            file: "README.md",
            line: 1,
            column: 1,
          },
        ],
        { build: "tsup" },
      ),
    ).toHaveLength(1);
  });
});
