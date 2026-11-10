/**
 * Accessibility contract for ```mermaid fences. Every diagram must carry an
 * `accTitle` (short name) and an `accDescr` (long description): Mermaid maps
 * them to the SVG `<title>` and `<desc>` elements, then to
 * `aria-labelledby`/`aria-describedby`. Without them the rendered SVG has no
 * accessible name and assistive technologies announce an empty graphic.
 *
 * The scan is line-based on purpose: it must run before Astro parses anything,
 * so a violation fails the build with a file and a line number.
 */

export type MermaidFence = {
  /** Fence body, without the opening and closing lines. */
  source: string;
  /** 1-based line of the opening fence. */
  line: number;
};

const FENCE_OPEN = /^\s{0,3}(`{3,})(.*)$/;
const FENCE_CLOSE = /^\s{0,3}(`{3,})\s*$/;
const ACC_TITLE = /^\s*accTitle\s*:/m;
const ACC_DESCR = /^\s*accDescr\s*:/m;
const ACC_DESCR_BLOCK = /^\s*accDescr\s*\{/m;

/**
 * List every ```mermaid fence in document order. Other fences are tracked so a
 * mermaid example nested in a code block is not mistaken for a diagram.
 * Unclosed fences are ignored.
 */
export function findMermaidFences(markdown: string): MermaidFence[] {
  const fences: MermaidFence[] = [];
  let open: { line: number; markerLength: number; isMermaid: boolean; body: string[] } | null =
    null;

  markdown.split(/\r?\n/).forEach((line, index) => {
    if (open) {
      const close = line.match(FENCE_CLOSE);

      if (close && close[1].length >= open.markerLength) {
        if (open.isMermaid) {
          fences.push({ source: open.body.join("\n"), line: open.line });
        }

        open = null;
        return;
      }

      open.body.push(line);
      return;
    }

    const start = line.match(FENCE_OPEN);

    if (start) {
      open = {
        line: index + 1,
        markerLength: start[1].length,
        isMermaid: start[2].trim() === "mermaid",
        body: []
      };
    }
  });

  return fences;
}

function hasAccTitle(source: string): boolean {
  return ACC_TITLE.test(source);
}

function hasAccDescr(source: string): boolean {
  return ACC_DESCR.test(source) || ACC_DESCR_BLOCK.test(source);
}

/**
 * Return one message per missing directive, with the fence line. Empty when
 * every diagram is named and described.
 */
export function mermaidAccessibilityErrors(markdown: string): string[] {
  return findMermaidFences(markdown).flatMap((fence) => {
    const errors: string[] = [];

    if (!hasAccTitle(fence.source)) {
      errors.push(`line ${fence.line}: mermaid diagram is missing accTitle`);
    }

    if (!hasAccDescr(fence.source)) {
      errors.push(`line ${fence.line}: mermaid diagram is missing accDescr`);
    }

    return errors;
  });
}
