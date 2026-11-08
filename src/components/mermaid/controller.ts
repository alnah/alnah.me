import { createDiagramDialog, type DiagramDialog } from "./dialog";
import { localiseRoleDescription, readTheme, renderDiagram } from "./render";
import type { MermaidTheme } from "./theme";

const EXPAND_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;

/** Fence bodies are captured before Mermaid replaces the pre content. */
const sources = new WeakMap<HTMLPreElement, string>();

/** Enhance every `pre.mermaid` and follow theme changes. */
export function registerMermaidDiagrams(): void {
  const diagrams = Array.from(document.querySelectorAll<HTMLPreElement>("pre.mermaid"));

  if (diagrams.length === 0) {
    return;
  }

  const dialog = createDiagramDialog();
  let theme = readTheme(document.documentElement);

  const renderAll = async (): Promise<void> => {
    await Promise.all(diagrams.map((pre) => renderDiagramInto(pre, theme, dialog)));
  };

  const observer = new MutationObserver(() => {
    dialog.close();
    theme = readTheme(document.documentElement);
    void renderAll();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  });

  void renderAll();
}

async function renderDiagramInto(
  pre: HTMLPreElement,
  theme: MermaidTheme,
  dialog: DiagramDialog
): Promise<void> {
  const source = sources.get(pre) ?? pre.textContent ?? "";
  sources.set(pre, source);

  try {
    pre.innerHTML = await renderDiagram(source, theme);

    const svg = pre.querySelector("svg");

    if (svg) {
      localiseRoleDescription(svg);
    }

    pre.dataset.processed = "true";
    delete pre.dataset.error;
    mountFigure(pre, dialog);
  } catch (error) {
    // Keep the fence source visible: a broken diagram must not disappear.
    pre.dataset.processed = "true";
    pre.dataset.error = "true";
    console.error("Mermaid render failed:", error);
  }
}

function mountFigure(pre: HTMLPreElement, dialog: DiagramDialog): void {
  if (pre.closest(".mermaid-figure")) {
    return;
  }

  const figure = document.createElement("div");
  figure.className = "mermaid-figure";
  pre.parentNode?.insertBefore(figure, pre);
  figure.appendChild(pre);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "mermaid-expand";
  button.setAttribute("aria-label", "Agrandir le diagramme");
  button.innerHTML = EXPAND_ICON;
  button.addEventListener("click", () => {
    const svg = pre.querySelector("svg");

    if (svg) {
      void dialog.open({ svg, title: diagramTitle(svg), source: sources.get(pre) ?? "" });
    }
  });

  figure.appendChild(button);
}

function diagramTitle(svg: SVGSVGElement): string | null {
  return svg.querySelector(":scope > title")?.textContent?.trim() || null;
}
