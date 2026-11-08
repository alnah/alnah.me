import { describeDiagramRole } from "./labels";
import { buildThemeVariables, createTokenReader, type MermaidTheme } from "./theme";

export type { MermaidTheme };

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
let diagramId = 0;

/** Lazy-load and memoize Mermaid. Nothing is fetched on pages without a diagram. */
export function loadMermaid(): Promise<typeof import("mermaid").default> {
  mermaidPromise ??= import("mermaid").then((module) => module.default);
  return mermaidPromise;
}

/** Read the live theme from the site tokens. */
export function readTheme(root: HTMLElement): MermaidTheme {
  const readVar = createTokenReader(root);

  return {
    fontFamily: readVar("--font-body") || "sans-serif",
    variables: buildThemeVariables(readVar)
  };
}

/** Replace Mermaid's internal diagram type key with a readable French label. */
export function localiseRoleDescription(svg: SVGSVGElement): void {
  const typeKey = svg.getAttribute("aria-roledescription");

  if (typeKey) {
    svg.setAttribute("aria-roledescription", describeDiagramRole(typeKey));
  }
}

/**
 * Apply the site theme to Mermaid. Called once per theme before rendering a
 * batch of diagrams.
 */
export async function configureMermaid(theme: MermaidTheme): Promise<void> {
  const mermaid = await loadMermaid();

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    fontFamily: theme.fontFamily,
    themeVariables: theme.variables,
    flowchart: { useMaxWidth: false, htmlLabels: true, curve: "basis" },
    sequence: { useMaxWidth: false },
    gantt: { useMaxWidth: false },
    class: { useMaxWidth: false },
    state: { useMaxWidth: false },
    er: { useMaxWidth: false }
  });
}

/**
 * Render one fence body to an SVG string. `useMaxWidth` is off (see
 * `configureMermaid`) so the SVG carries its natural size, which the dialog
 * needs to compute a fit scale.
 */
export async function renderDiagram(source: string): Promise<string> {
  const mermaid = await loadMermaid();

  diagramId += 1;
  const id = `mermaid-diagram-${diagramId}`;

  try {
    const { svg } = await mermaid.render(id, source);
    return svg;
  } finally {
    // Mermaid appends a `d<id>` scratch node and leaves it behind on failure.
    document.getElementById(`d${id}`)?.remove();
  }
}
