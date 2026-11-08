import type { PanzoomObject } from "@panzoom/panzoom";
import { readAttribution } from "./attribution";
import { buildAttributedSvg, buildCopyText, diagramFileName } from "./export-svg";
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
} from "./icons";

export type DiagramDialogInput = {
  svg: SVGSVGElement;
  title: string | null;
  source: string;
};

export type DiagramDialog = {
  /** Move the SVG into a modal with zoom and pan. */
  open(input: DiagramDialogInput): Promise<void>;
  /** Close the modal and restore the SVG to its figure. */
  close(): void;
};

type PanzoomFactory = typeof import("@panzoom/panzoom").default;

type DialogRefs = {
  dialog: HTMLDialogElement;
  viewport: HTMLElement;
  stage: HTMLElement;
  scale: HTMLOutputElement;
  status: HTMLElement;
};

const PAN_STEP = 60;
const MAX_SCALE = 8;
const ZOOM_STEP = Math.exp(0.3);

type DiagramAction =
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
const KEY_ACTIONS: Record<string, DiagramAction> = {
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

const DIALOG_MARKUP = `
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

let panzoomFactory: PanzoomFactory | null = null;

async function loadPanzoomFactory(): Promise<PanzoomFactory> {
  if (!panzoomFactory) {
    const module = await import("@panzoom/panzoom");
    panzoomFactory = module.default;
  }

  return panzoomFactory;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type NaturalSize = {
  width: number;
  height: number;
};

function readNaturalSize(svg: SVGSVGElement): NaturalSize {
  const width = Number(svg.getAttribute("width"));
  const height = Number(svg.getAttribute("height"));

  if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
    return { width, height };
  }

  const rect = svg.getBoundingClientRect();

  return { width: rect.width, height: rect.height };
}

function computeFitScale(natural: NaturalSize, viewport: HTMLElement): number {
  if (!natural.width || !natural.height) {
    return 1;
  }

  const padding = 48;
  const scale = Math.min(
    (viewport.clientWidth - padding) / natural.width,
    (viewport.clientHeight - padding) / natural.height
  );

  return Math.min(8, Math.max(0.05, scale));
}

/** One dialog per page, created on first use and reused afterwards. */
export function createDiagramDialog(): DiagramDialog {
  let refs: DialogRefs | null = null;
  let panzoom: PanzoomObject | null = null;
  let home: { parent: Node; next: Node | null } | null = null;
  let currentSvg: SVGSVGElement | null = null;
  let currentTitle: string | null = null;
  let currentSource = "";
  let fitScale = 1;
  let minScale = 0.05;
  let statusTimer = 0;

  function zoomBy(factor: number): void {
    if (!panzoom || !refs) {
      return;
    }

    const next = Math.min(MAX_SCALE, Math.max(minScale, panzoom.getScale() * factor));
    const rect = refs.viewport.getBoundingClientRect();

    panzoom.zoomToPoint(next, {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    });
  }

  function announce(message: string): void {
    if (!refs) {
      return;
    }

    refs.status.textContent = message;
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      if (refs) {
        refs.status.textContent = "";
      }
    }, 2000);
  }

  async function copySource(): Promise<void> {
    if (!currentSource) {
      return;
    }

    const text = buildCopyText(currentSource, readAttribution(currentTitle));

    try {
      await navigator.clipboard.writeText(text);
      announce("Source copiée");
    } catch (error) {
      announce("Copie impossible");
      console.error("Mermaid copy failed:", error);
    }
  }

  function downloadSvg(): void {
    if (!currentSvg) {
      return;
    }

    const attribution = readAttribution(currentTitle);
    const style = getComputedStyle(document.documentElement);
    const markup = buildAttributedSvg(currentSvg, attribution, {
      background: style.getPropertyValue("--color-bg").trim() || "#ffffff",
      foreground: style.getPropertyValue("--color-text").trim() || "#000000"
    });
    const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = diagramFileName(attribution.title);
    anchor.click();
    URL.revokeObjectURL(url);
    announce("SVG téléchargé");
  }

  function updateScale(): void {
    if (!refs || !panzoom) {
      return;
    }

    const scale = panzoom.getScale();
    refs.scale.value = `${Math.round(scale * 100)} %`;
    refs.dialog.dataset.zoomed = scale > fitScale + 0.01 ? "true" : "false";
  }

  function panBy(x: number, y: number): void {
    panzoom?.pan(x, y, { relative: true });
  }

  const actions: Record<DiagramAction, () => void> = {
    "zoom-in": () => zoomBy(ZOOM_STEP),
    "zoom-out": () => zoomBy(1 / ZOOM_STEP),
    reset: () => panzoom?.reset(),
    copy: () => void copySource(),
    download: () => downloadSvg(),
    "pan-up": () => panBy(0, PAN_STEP),
    "pan-down": () => panBy(0, -PAN_STEP),
    "pan-left": () => panBy(PAN_STEP, 0),
    "pan-right": () => panBy(-PAN_STEP, 0),
    close: () => refs?.dialog.close()
  };

  function runAction(action: string): void {
    const run = actions[action as DiagramAction];
    run?.();
  }

  function handleKeydown(event: KeyboardEvent): void {
    const action = KEY_ACTIONS[event.key];

    if (!action) {
      return;
    }

    runAction(action);
    event.preventDefault();
  }

  function handleClose(): void {
    panzoom?.resetStyle();
    panzoom?.destroy();
    panzoom = null;

    if (currentSvg && home) {
      home.parent.insertBefore(currentSvg, home.next);
    }

    currentSvg = null;
    home = null;

    if (refs) {
      refs.stage.replaceChildren();
      refs.stage.style.removeProperty("transform");
      refs.stage.style.removeProperty("transition");
    }

    document.documentElement.style.overflow = "";
  }

  function ensureDialog(): DialogRefs {
    if (refs) {
      return refs;
    }

    const dialog = document.createElement("dialog");
    dialog.className = "mermaid-dialog";
    dialog.innerHTML = DIALOG_MARKUP;
    document.body.appendChild(dialog);

    const viewport = dialog.querySelector<HTMLElement>(".mermaid-dialog__viewport");
    const stage = dialog.querySelector<HTMLElement>(".mermaid-dialog__stage");
    const scale = dialog.querySelector<HTMLOutputElement>(".mermaid-dialog__scale");
    const status = dialog.querySelector<HTMLElement>("[data-mermaid-status]");

    if (!viewport || !stage || !scale || !status) {
      throw new Error("Mermaid dialog markup is incomplete");
    }

    dialog.addEventListener("click", (event) => {
      const target = event.target as Element | null;
      const action = target?.closest<HTMLElement>("[data-mermaid-action]")?.dataset.mermaidAction;

      if (action) {
        runAction(action);
      }
    });
    dialog.addEventListener("close", handleClose);
    viewport.addEventListener("keydown", handleKeydown);
    viewport.addEventListener(
      "wheel",
      (event) => {
        panzoom?.zoomWithWheel(event);
      },
      { passive: false }
    );

    refs = { dialog, viewport, stage, scale, status };
    return refs;
  }

  async function open(input: DiagramDialogInput): Promise<void> {
    const elements = ensureDialog();
    const svg = input.svg;
    const parent = svg.parentNode;

    home = parent ? { parent, next: svg.nextSibling } : null;
    currentSvg = svg;
    currentTitle = input.title;
    currentSource = input.source;

    svg.removeAttribute("style");
    elements.stage.replaceChildren(svg);
    elements.stage.style.removeProperty("transform");
    elements.dialog.setAttribute("aria-label", input.title ?? "Diagramme");
    elements.dialog.dataset.ready = "false";
    elements.dialog.showModal();
    document.documentElement.style.overflow = "hidden";

    const factory = await loadPanzoomFactory();
    const natural = readNaturalSize(svg);
    fitScale = computeFitScale(natural, elements.viewport);
    minScale = Math.max(0.05, fitScale / 2);
    const startX = (elements.viewport.clientWidth - natural.width) / (2 * fitScale);
    const startY = (elements.viewport.clientHeight - natural.height) / (2 * fitScale);

    // No `contain`: panzoom caps the max scale at the fit scale when contained,
    // which blocks zooming in. Centering is passed as the reset position.
    panzoom = factory(elements.stage, {
      maxScale: MAX_SCALE,
      minScale,
      startScale: fitScale,
      startX,
      startY,
      canvas: true,
      cursor: "grab",
      panOnlyWhenZoomed: true,
      touchAction: "none",
      animate: !prefersReducedMotion()
    });

    // Apply the reset position before revealing, so the first paint is already
    // centered instead of the natural-size SVG jumping into place.
    panzoom.pan(startX, startY, { animate: false, force: true });
    elements.stage.addEventListener("panzoomchange", updateScale);
    updateScale();

    // Reveal one frame after the pan rAF so the fitted transform is painted.
    requestAnimationFrame(() => {
      elements.dialog.dataset.ready = "true";
      elements.viewport.focus();
    });
  }

  function close(): void {
    refs?.dialog.close();
  }

  return { open, close };
}
