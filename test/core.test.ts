import { describe, expect, it } from "vitest";

import { exitCodeForFindings } from "../src/exit-codes.js";
import { run, sortAndDedupeFindings } from "../src/run.js";
import type { Finding } from "../src/types.js";
import { DriftcheckError } from "../src/util/errors.js";

const findings: Finding[] = [
  {
    file: "b.md",
    line: 2,
    column: 1,
    rule: "docs-link-broken-file",
    severity: "error",
    message: "missing",
  },
  {
    file: "a.md",
    line: 1,
    column: 1,
    rule: "docs-orphan",
    severity: "warn",
    message: "orphan",
  },
];

describe("core pipeline", () => {
  it("sorts and removes identical findings", () => {
    expect(sortAndDedupeFindings([findings[0]!, findings[1]!, findings[0]!])).toEqual([
      findings[1],
      findings[0],
    ]);
  });

  it("runs pipeline stages in order", async () => {
    const calls: string[] = [];
    const result = await run(
      {},
      {
        loadConfig: async () => {
          calls.push("config");
          return {};
        },
        listFiles: async () => {
          calls.push("files");
          return ["a.md"];
        },
        extractFacts: async () => {
          calls.push("facts");
          return [];
        },
        applyRules: async () => {
          calls.push("rules");
          return findings;
        },
        filterFindings: async (unfiltered) => {
          calls.push("filter");
          return unfiltered;
        },
      },
    );

    expect(calls).toEqual(["config", "files", "facts", "rules", "filter"]);
    expect(result.summary).toMatchObject({ errors: 1, warnings: 1, files: 1 });
  });

  it("selects exit codes by threshold", () => {
    expect(exitCodeForFindings(findings)).toBe(1);
    expect(exitCodeForFindings([findings[1]!], "error")).toBe(0);
    expect(exitCodeForFindings([findings[1]!], "warn")).toBe(1);
    expect(exitCodeForFindings(findings, "never")).toBe(0);
  });

  it("keeps the expected exit code on known errors", () => {
    const error = new DriftcheckError("bad config", 2);
    expect(error).toMatchObject({
      message: "bad config",
      exitCode: 2,
      name: "DriftcheckError",
    });
  });
});
