import {
  closeIcon,
  copyIcon,
  downloadIcon,
  fitIcon,
  panDownIcon,
  panLeftIcon,
  panRightIcon,
  panUpIcon,
  zoomInIcon,
  zoomOutIcon
} from "./icons.ts";

export type DiagramAction =
  | "zoom-in"
  | "zoom-out"
  | "reset"
  | "copy"
  | "download"
  | "pan-up"
  | "pan-down"
  | "pan-left"
  | "pan-right"
  | "close";

/** Keyboard shortcuts mapped to the same actions as the toolbar buttons. */
export const KEY_ACTIONS: Record<string, DiagramAction> = {
  "+": "zoom-in",
  "=": "zoom-in",
  Add: "zoom-in",
  "-": "zoom-out",
  _: "zoom-out",
  Subtract: "zoom-out",
  "0": "reset",
  Home: "reset",
  ArrowUp: "pan-up",
  ArrowDown: "pan-down",
  ArrowLeft: "pan-left",
  ArrowRight: "pan-right"
};

export const DIALOG_MARKUP = `
  <div class="mermaid-dialog__toolbar">
    <button type="button" class="mermaid-dialog__control" data-mermaid-action="zoom-out" aria-label="Dézoomer">${zoomOutIcon}</button>
    <output class="mermaid-dialog__scale" aria-live="polite">100 %</output>
    <button type="button" class="mermaid-dialog__control" data-mermaid-action="zoom-in" aria-label="Zoomer">${zoomInIcon}</button>
    <button type="button" class="mermaid-dialog__control" data-mermaid-action="reset" aria-label="Ajuster à l'écran">${fitIcon}</button>
    <button type="button" class="mermaid-dialog__control" data-mermaid-action="copy" aria-label="Copier la source du diagramme">${copyIcon}</button>
    <button type="button" class="mermaid-dialog__control" data-mermaid-action="download" aria-label="Télécharger le diagramme en SVG">${downloadIcon}</button>
    <div class="mermaid-dialog__pan">
      <button type="button" class="mermaid-dialog__control" data-mermaid-action="pan-left" aria-label="Déplacer vers la gauche">${panLeftIcon}</button>
      <button type="button" class="mermaid-dialog__control" data-mermaid-action="pan-up" aria-label="Déplacer vers le haut">${panUpIcon}</button>
      <button type="button" class="mermaid-dialog__control" data-mermaid-action="pan-down" aria-label="Déplacer vers le bas">${panDownIcon}</button>
      <button type="button" class="mermaid-dialog__control" data-mermaid-action="pan-right" aria-label="Déplacer vers la droite">${panRightIcon}</button>
    </div>
    <button type="button" class="mermaid-dialog__control" data-mermaid-action="close" aria-label="Fermer">${closeIcon}</button>
  </div>
  <div class="mermaid-dialog__viewport" tabindex="0" role="group" aria-label="Diagramme. Utilisez la molette, les flèches ou les boutons pour naviguer.">
    <div class="mermaid-dialog__stage"></div>
  </div>
  <p class="visually-hidden" data-mermaid-status aria-live="polite"></p>
`;
