import { readAttribution } from "./attribution";
import { buildCopyText } from "./copy-text";
import { buildAttributedSvg, diagramFileName } from "./export-svg";
import { createTokenReader } from "./theme";

export type DiagramExport = {
  svg: SVGSVGElement;
  title: string | null;
  source: string;
};

export type ExportFeedback = {
  success(message: string): void;
  failure(message: string, error: unknown): void;
};

/** Put the Mermaid source on the clipboard, prefixed with the attribution comment. */
export async function copyDiagramSource(
  diagram: DiagramExport,
  feedback: ExportFeedback
): Promise<void> {
  if (!diagram.source) {
    return;
  }

  const text = buildCopyText(diagram.source, readAttribution(diagram.title));

  try {
    await navigator.clipboard.writeText(text);
    feedback.success("Source copiée");
  } catch (error) {
    feedback.failure("Copie impossible", error);
  }
}

/** Download the diagram as a standalone SVG with a background and a credit footer. */
export function downloadDiagramSvg(diagram: DiagramExport, feedback: ExportFeedback): void {
  const attribution = readAttribution(diagram.title);
  const readVar = createTokenReader(document.documentElement);
  const markup = buildAttributedSvg(diagram.svg, attribution, {
    background: readVar("--color-bg") || "#ffffff",
    foreground: readVar("--color-text") || "#000000"
  });
  const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = diagramFileName(attribution.title);
  anchor.click();
  URL.revokeObjectURL(url);
  feedback.success("SVG téléchargé");
}
