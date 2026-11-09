import { describe, expect, it } from "vitest";

import { renderCompact } from "../src/report/compact.js";
import { renderJson } from "../src/report/json.js";
import { renderTree } from "../src/report/tree.js";
import type { Finding, RunResult } from "../src/types.js";

const finding: Finding = {
  file: "README.md",
  line: 3,
  column: 2,
  rule: "docs-script-missing",
  severity: "error",
  message: "script is missing",
};
const result: RunResult = {
  findings: [finding],
  summary: { errors: 1, warnings: 0, info: 0, files: 2, durationMs: 4 },
};

describe("reporters", () => {
  it("renders compact findings", () => {
    expect(renderCompact([finding])).toBe(
      "README.md:3:2 error docs-script-missing script is missing",
    );
  });

  it("renders the documented JSON shape", () => {
    expect(JSON.parse(renderJson("/project", result))).toEqual({
      version: "0.1.0",
      root: "/project",
      summary: result.summary,
      findings: [finding],
    });
  });

  it("renders a tree without terminal control codes", () => {
    const output = renderTree("/project", [finding], result.summary);
    expect(output).toContain("driftcheck  /project");
    expect(output).toContain("docs-script-missing");
    expect(output).not.toContain(`${String.fromCharCode(27)}[`);
  });

  it("truncates display without changing supplied results", () => {
    expect(renderCompact([finding, finding], 1).split("\n")).toHaveLength(1);
    expect(result.findings).toHaveLength(1);
  });
});
