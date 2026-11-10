import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractMarkdown } from "../../src/extract/markdown.js";
import { findOrphanDocs } from "../../src/rules/docs/orphan.js";
import { findMissingPaths } from "../../src/rules/docs/path.js";
import { findBrokenLinks } from "../../src/rules/docs/link.js";
import { filterInlineIgnores } from "../../src/ignore/directives.js";
import type { Finding, MarkdownLink } from "../../src/types.js";
const link = (file: string, target: string): MarkdownLink => ({
  kind: "markdown-link",
  file,
  target,
  text: "x",
  image: false,
  line: 1,
  column: 1,
});
describe("docs regressions", () => {
  it("recognizes explicit package commands but not prose", () => {
    expect(
      extractMarkdown("npm run build. npm to run things", "README.md").scripts.map(
        (item) => item.script,
      ),
    ).toEqual(["build"]);
  });
  it("reports case mismatches and resolves decoded directory targets", async () => {
    const root = await mkdtemp(join(tmpdir(), "driftcheck-links-"));
    const readme = join(root, "README.md");
    await writeFile(readme, "x");
    await writeFile(join(root, "Guide.md"), "# guide");
    await mkdir(join(root, "space dir"));
    await writeFile(join(root, "space dir", "README.md"), "# here");
    expect((await findBrokenLinks(root, [link(readme, "guide.md")], []))[0]?.rule).toBe(
      "docs-link-case-mismatch",
    );
    expect(await findBrokenLinks(root, [link(readme, "space%20dir/")], [])).toEqual([]);
  });
  it("keeps URLs and unknown top-level prose paths quiet", async () => {
    const root = await mkdtemp(join(tmpdir(), "driftcheck-path-"));
    expect(
      await findMissingPaths(root, [
        {
          kind: "path-mention",
          value: "https://x.test/a",
          file: "README.md",
          line: 1,
          column: 1,
        },
        {
          kind: "path-mention",
          value: "unknown/path.txt",
          file: "README.md",
          line: 1,
          column: 1,
        },
      ]),
    ).toEqual([]);
  });
  it("normalizes linked orphan targets", () => {
    expect(
      findOrphanDocs(
        ["README.md", "docs/guide.md"],
        [link("README.md", "./docs/guide.md")],
        ["README.md"],
      ),
    ).toEqual([]);
  });
  it("supports disable and enable directive ranges", () => {
    const finding: Finding = {
      rule: "env-undocumented",
      severity: "error",
      message: "x",
      file: "a",
      line: 2,
      column: 1,
    };
    expect(
      filterInlineIgnores(
        "// driftcheck-disable env-undocumented\nx\n// driftcheck-enable env-undocumented\nx",
        [finding, { ...finding, line: 4 }],
      ),
    ).toEqual([{ ...finding, line: 4 }]);
  });
});
