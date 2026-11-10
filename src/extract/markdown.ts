import { unified } from "unified";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";

import type {
  MarkdownHeading,
  MarkdownLink,
  PathMention,
  ScriptReference,
} from "../types.js";
import { createSlug } from "../util/slug.js";

export interface MarkdownFacts {
  headings: MarkdownHeading[];
  links: MarkdownLink[];
  scripts: ScriptReference[];
  paths: PathMention[];
  fencesWithoutLanguage: PathMention[];
}

function position(
  node: { position?: { start?: { line?: number; column?: number } } },
  file: string,
) {
  return {
    file,
    line: node.position?.start?.line ?? 1,
    column: node.position?.start?.column ?? 1,
  };
}

function textOf(node: unknown): string {
  if (typeof node !== "object" || node === null) return "";
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node && Array.isArray(node.children))
    return node.children.map(textOf).join("");
  return "";
}

export function extractMarkdown(text: string, file: string): MarkdownFacts {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .parse(text);
  const headings: MarkdownHeading[] = [];
  const links: MarkdownLink[] = [];
  const scripts: ScriptReference[] = [];
  const paths: PathMention[] = [];
  const fencesWithoutLanguage: PathMention[] = [];
  const seenSlugs = new Map<string, number>();
  visit(tree, (node) => {
    const location = position(node, file);
    if (node.type === "heading") {
      const headingText = textOf(node);
      headings.push({
        kind: "markdown-heading",
        text: headingText,
        slug: createSlug(headingText, seenSlugs),
        ...location,
      });
    }
    if (node.type === "link" || node.type === "image") {
      links.push({
        kind: "markdown-link",
        target: node.url,
        text: textOf(node),
        image: node.type === "image",
        ...location,
      });
    }
    if (node.type === "code") {
      if (!node.lang)
        fencesWithoutLanguage.push({ kind: "path-mention", value: "fence", ...location });
      for (const token of node.value.split(/\s+/))
        if (token.includes("/") || /\.[A-Za-z0-9]+$/.test(token))
          paths.push({ kind: "path-mention", value: token, ...location });
    }
    if (node.type === "inlineCode") {
      for (const token of node.value.split(/\s+/))
        if (token.includes("/") || /\.[A-Za-z0-9]+$/.test(token))
          paths.push({ kind: "path-mention", value: token, ...location });
    }
    if (node.type === "text") {
      for (const match of node.value.matchAll(
        /\b(?:npm|yarn|pnpm|bun)\s+(?:run\s+)?([A-Za-z0-9:_-]+)/g,
      )) {
        const script = match[1] ?? "";
        if (["to", "and", "or", "the", "a"].includes(script)) continue;
        scripts.push({
          kind: "script-reference",
          command: match[0] ?? "",
          script,
          ...location,
        });
      }
    }
  });
  return { headings, links, scripts, paths, fencesWithoutLanguage };
}
