import type { HastNode, HastPluginDefinition } from "satteri";

type HastElement = Extract<HastNode, { type: "element" }>;

const NON_WHITESPACE = /\S/;

function classList(node: HastElement): string[] {
  const value = node.properties?.className;

  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "string") {
    return value.split(/\s+/).filter(Boolean);
  }

  return [];
}

/**
 * Return the single `code.language-mermaid` child of a `pre`, or null when the
 * `pre` holds anything else. Mirrors the detection used by `rehype-mermaid`.
 */
function mermaidCode(pre: HastElement): HastElement | null {
  let code: HastElement | null = null;

  for (const child of pre.children) {
    if (child.type === "text") {
      if (NON_WHITESPACE.test(child.value)) {
        return null;
      }

      continue;
    }

    if (
      child.type === "element" &&
      child.tagName === "code" &&
      classList(child).includes("language-mermaid")
    ) {
      if (code) {
        return null;
      }

      code = child;
      continue;
    }

    return null;
  }

  return code;
}

/**
 * Replace a ```mermaid fence (`pre > code.language-mermaid`) with
 * `<pre class="mermaid">source</pre>` for the client script to render.
 *
 * Requires `mermaid` in `markdown.syntaxHighlight.excludeLangs` so Shiki does
 * not tokenise the fence into spans first.
 */
export function mermaid(): HastPluginDefinition {
  return {
    name: "mermaid",
    element: {
      filter: ["pre"],
      visit(node, ctx) {
        const code = mermaidCode(node);

        if (!code) {
          return;
        }

        return {
          type: "element",
          tagName: "pre",
          properties: { className: ["mermaid"] },
          children: [{ type: "text", value: ctx.textContent(code) }]
        };
      }
    }
  };
}
