import { describe, expect, it } from "vitest";

import { packageName } from "../src/index.js";

describe("package", () => {
  it("exports its package name", () => {
    expect(packageName).toBe("driftcheck");
  });
});
