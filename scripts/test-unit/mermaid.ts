import assert from "node:assert/strict";
import { buildCopyText } from "../../src/components/mermaid/copy-text.ts";
import { createDragGuard } from "../../src/components/mermaid/drag.ts";
import { diagramFileName } from "../../src/components/mermaid/export-svg.ts";
import { describeDiagramRole } from "../../src/components/mermaid/labels.ts";
import { buildThemeVariables } from "../../src/components/mermaid/theme.ts";
import { computeFitScale } from "../../src/components/mermaid/viewport.ts";
import { findMermaidFences, mermaidAccessibilityErrors } from "../../src/lib/content/mermaid-contract.ts";

/** Fence contract, theme mapping, fit math, labels, and export. */
export function testMermaid(): void {
  const validMermaidFence = [
    "```mermaid",
    "flowchart TD",
    "  accTitle: Flux d'authentification",
    "  accDescr: Décrit le parcours de connexion.",
    "  A --> B",
    "```"
  ].join("\n");
  const blockDescrFence = [
    "```mermaid",
    "sequenceDiagram",
    "  accTitle: Échange",
    "  accDescr {",
    "    Premier échange.",
    "    Second échange.",
    "  }",
    "  A->>B: Salut",
    "```"
  ].join("\n");
  const undocumentedFence = ["```mermaid", "flowchart TD", "  A --> B", "```"].join("\n");
  const missingDescrFence = [
    "```mermaid",
    "flowchart TD",
    "  accTitle: Titre",
    "  A --> B",
    "```"
  ].join("\n");
  const nestedMermaidExample = [
    "````markdown",
    "```mermaid",
    "flowchart TD",
    "  A --> B",
    "```",
    "````"
  ].join("\n");

  assert.deepEqual(findMermaidFences("No fence here."), []);
  assert.equal(findMermaidFences(`Intro.\n\n${validMermaidFence}`).length, 1);
  assert.equal(findMermaidFences(`Intro.\n\n${validMermaidFence}`)[0].line, 3);
  assert.ok(findMermaidFences(validMermaidFence)[0].source.includes("flowchart TD"));
  assert.deepEqual(
    findMermaidFences(nestedMermaidExample),
    [],
    "a mermaid example nested in a code block is not a diagram"
  );
  assert.deepEqual(mermaidAccessibilityErrors(validMermaidFence), []);
  assert.deepEqual(mermaidAccessibilityErrors(blockDescrFence), []);
  assert.equal(mermaidAccessibilityErrors(undocumentedFence).length, 2);
  assert.match(mermaidAccessibilityErrors(missingDescrFence)[0], /missing accDescr/);
  assert.equal(mermaidAccessibilityErrors(missingDescrFence).length, 1);

  const tokenValues: Record<string, string> = {
    "--color-bg": "#ffffff",
    "--color-surface": "#f8f9fa",
    "--color-surface-strong": "#e9ecef",
    "--color-text": "#212529",
    "--color-text-muted": "#6c757d",
    "--color-border": "#dee2e6",
    "--color-shade": "#000000"
  };
  const themeVariables = buildThemeVariables((token) => tokenValues[token] ?? "");

  assert.equal(themeVariables.mainBkg, "#e9ecef");
  assert.equal(themeVariables.lineColor, "#6c757d");
  assert.equal(themeVariables.clusterBorder, "#dee2e6");
  assert.ok(
    !Object.values(themeVariables).some(
      (value) => typeof value === "string" && value.includes("color-mix")
    ),
    "mermaid variables must be solid colors"
  );
  assert.equal(themeVariables.dropShadow, "drop-shadow(0 2px 0 rgba(0, 0, 0, 0.2))");
  assert.equal(themeVariables.nodeShadow, false);

  assert.equal(describeDiagramRole("flowchart-v2"), "diagramme de flux");
  assert.equal(describeDiagramRole("sequenceDiagram"), "diagramme de séquence");
  assert.equal(describeDiagramRole("unknown-key"), "diagramme");

  assert.equal(computeFitScale({ width: 0, height: 0 }, { clientWidth: 800, clientHeight: 600 }), 1);
  assert.equal(
    computeFitScale({ width: 1000, height: 1000 }, { clientWidth: 848, clientHeight: 648 }),
    0.6
  );
  assert.equal(computeFitScale({ width: 1, height: 1 }, { clientWidth: 848, clientHeight: 648 }), 8);
  assert.equal(
    computeFitScale(
      { width: 1_000_000, height: 1_000_000 },
      { clientWidth: 848, clientHeight: 648 }
    ),
    0.05
  );

  assert.equal(diagramFileName("Parcours de connexion"), "parcours-de-connexion.svg");
  assert.equal(diagramFileName("Échange client/serveur"), "echange-client-serveur.svg");
  assert.equal(diagramFileName("***"), "diagramme.svg");

  const copyText = buildCopyText("flowchart TD\n  A --> B", {
    title: "Parcours",
    author: "Alexis Nahan (alnah)",
    siteName: "alnah.me",
    siteUrl: "https://alnah.me",
    pageUrl: "https://alnah.me/articles/essai/",
    date: "2026-12-01",
    licenseName: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/"
  });

  assert.ok(copyText.includes("Alexis Nahan (alnah)"));
  assert.ok(copyText.includes("https://alnah.me/articles/essai/ (2026-12-01)"));
  assert.ok(copyText.includes("CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)"));
  assert.ok(copyText.includes("```mermaid"));

  const dragGuard = createDragGuard(6);
  dragGuard.start(10, 10);
  dragGuard.move(12, 13);
  assert.equal(dragGuard.consumesClick(1), false, "a short move keeps the click");
  dragGuard.move(30, 10);
  assert.equal(dragGuard.consumesClick(1), true, "a drag swallows the click");
  assert.equal(dragGuard.consumesClick(1), false, "the guard consumes a drag once");
  dragGuard.start(0, 0);
  dragGuard.move(50, 0);
  assert.equal(dragGuard.consumesClick(0), false, "a keyboard click passes through");
}
