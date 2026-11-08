import type { DiagramAttribution } from "./attribution";

/** Mermaid source plus an attribution comment, ready for the clipboard. */
export function buildCopyText(source: string, attribution: DiagramAttribution): string {
  const article = attribution.date
    ? `Article : ${attribution.pageUrl} (${attribution.date})`
    : `Article : ${attribution.pageUrl}`;

  return [
    "<!--",
    `  Diagramme : ${attribution.title}`,
    `  Auteur : ${attribution.author}`,
    `  Blog : ${attribution.siteName} (${attribution.siteUrl})`,
    `  ${article}`,
    `  Licence : ${attribution.licenseName} (${attribution.licenseUrl})`,
    "-->",
    "",
    "```mermaid",
    source.trim(),
    "```"
  ].join("\n");
}
