import { describe, expect, it } from "vitest";
import { extractPythonEnv } from "../src/extract/py-env.js";
describe("Python environment extraction", () => {
  it("extracts literal keys and skips comments", () => {
    const result = extractPythonEnv("os.getenv('KEY')\n# os.getenv('COMMENT')", "app.py");
    expect(result.reads.map((read) => read.name)).toEqual(["KEY"]);
  });
});
