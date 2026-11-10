import { describe, expect, it } from "vitest";

import { extractMarkdown } from "../src/extract/markdown.js";
import { createSlug } from "../src/util/slug.js";

describe("markdown extraction", () => {
  it("creates GitHub-style unique slugs", () => {
    const seen = new Map<string, number>();
    expect(createSlug("Hello, World!", seen)).toBe("hello-world");
    expect(createSlug("Hello, World!", seen)).toBe("hello-world-1");
    expect(createSlug("`Code` and [link](x)")).toBe("code-and-link");
  });
  it("collects headings and links while treating code as non-links", () => {
    const facts = extractMarkdown(
      "---\ntitle: test\n---\nTitle\n=====\n[Guide](docs/guide.md)\n`src/app.ts`\n```\nREADME.md\n```",
      "README.md",
    );
    expect(facts.headings.map((heading) => heading.slug)).toEqual(["title"]);
    expect(facts.links.map((link) => link.target)).toEqual(["docs/guide.md"]);
    expect(facts.paths.map((path) => path.value)).toContain("src/app.ts");
    expect(facts.fencesWithoutLanguage).toHaveLength(1);
  });
  it("collects explicit script references", () => {
    expect(
      extractMarkdown("Run npm run build and npm test", "README.md").scripts.map(
        (script) => script.script,
      ),
    ).toEqual(["build", "test"]);
  });
});
