import { describe, expect, it } from "vitest";
import { extractMakeTargets } from "../src/extract/makefile.js";
import { readPackageScripts } from "../src/extract/package-json.js";
import { findMissingBins } from "../src/rules/docs/bin.js";
import { findDuplicateHeadings } from "../src/rules/docs/duplicate-heading.js";
import { findFencesWithoutLanguage } from "../src/rules/docs/fence.js";
import { findMissingMakeTargets } from "../src/rules/docs/make-target.js";
import { findOrphanDocs } from "../src/rules/docs/orphan.js";
import { findMissingPaths } from "../src/rules/docs/path.js";
import { findDynamicEnvAccess } from "../src/rules/env/dynamic-access.js";
import { findEnvMissingInCi } from "../src/rules/env/missing-in-ci.js";
import { findEnvNotInDocs } from "../src/rules/env/not-in-docs.js";
import { renderGitHub } from "../src/report/github.js";
import { renderSarif } from "../src/report/sarif.js";
import type {
  EnvDeclaration,
  EnvRead,
  Finding,
  MarkdownHeading,
  ScriptReference,
} from "../src/types.js";
const finding: Finding = {
  rule: "docs-orphan",
  severity: "warn",
  message: "orphan",
  file: "docs/a.md",
  line: 1,
  column: 1,
};
const reference: ScriptReference = {
  kind: "script-reference",
  command: "make build",
  script: "build",
  file: "README.md",
  line: 1,
  column: 1,
};
const read: EnvRead = {
  kind: "env-read",
  name: "KEY",
  optional: false,
  public: false,
  file: "src/a.ts",
  line: 1,
  column: 1,
};
const declaration: EnvDeclaration = {
  kind: "env-declaration",
  name: "KEY",
  value: "x",
  source: "dotenv",
  file: ".env.example",
  line: 1,
  column: 1,
};
describe("coverage behavior gaps", () => {
  it("extracts Make targets", () =>
    expect(extractMakeTargets("build:\n\ttsc\ntest: \n")).toEqual(
      new Set(["build", "test"]),
    ));
  it("reports missing local bins and Make targets", () => {
    expect(
      findMissingBins([{ ...reference, command: "npx local" }], new Set()),
    ).toHaveLength(1);
    expect(findMissingMakeTargets([reference], new Set())).toHaveLength(1);
  });
  it("reports duplicate headings and untagged fences", () => {
    const heading: MarkdownHeading = {
      kind: "markdown-heading",
      text: "Same",
      slug: "same",
      file: "README.md",
      line: 1,
      column: 1,
    };
    expect(findDuplicateHeadings([heading, { ...heading, line: 2 }])).toHaveLength(1);
    expect(
      findFencesWithoutLanguage([
        { kind: "path-mention", value: "fence", file: "README.md", line: 1, column: 1 },
      ]),
    ).toHaveLength(1);
  });
  it("reports orphan docs and absent repository paths", async () => {
    expect(findOrphanDocs(["README.md", "docs/old.md"], [], ["README.md"])).toHaveLength(
      1,
    );
    expect(
      await findMissingPaths(process.cwd(), [
        {
          kind: "path-mention",
          value: "not-real.md",
          file: "README.md",
          line: 1,
          column: 1,
        },
      ]),
    ).toHaveLength(1);
  });
  it("reports env workflow and documentation gaps", () => {
    expect(findEnvMissingInCi([read], [])).toHaveLength(1);
    expect(findEnvNotInDocs([declaration], new Set())).toHaveLength(1);
    expect(
      findDynamicEnvAccess({
        kind: "env-dynamic-access",
        expression: "x",
        file: "a.ts",
        line: 1,
        column: 1,
      }).rule,
    ).toBe("env-dynamic-access");
  });
  it("renders GitHub annotations and SARIF results", () => {
    expect(renderGitHub([finding])).toContain("::warning file=docs/a.md");
    const sarif = JSON.parse(renderSarif([finding]));
    expect(sarif.runs[0].results[0].ruleId).toBe("docs-orphan");
  });
  it("reads package scripts from this package", async () => {
    await expect(readPackageScripts("package.json")).resolves.toHaveProperty("build");
  });
});
