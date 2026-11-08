import type { PanzoomObject } from "@panzoom/panzoom";

export type DiagramDialogInput = {
  svg: SVGSVGElement;
  title: string | null;
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

const ICON_ZOOM_IN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.7" y2="16.7"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`;
const ICON_ZOOM_OUT = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.7" y2="16.7"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`;
const ICON_FIT = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M8 21H5a2 2 0 0 1-2-2v-3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>`;
const ICON_CLOSE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const ICON_PAN_UP = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 15 12 9 18 15"></polyline></svg>`;
const ICON_PAN_DOWN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
const ICON_PAN_LEFT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 6 9 12 15 18"></polyline></svg>`;
const ICON_PAN_RIGHT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"></polyline></svg>`;

const PAN_STEP = 60;

const DIALOG_MARKUP = `
  <div class="mermaid-dialog__toolbar">
    <button type="button" class="mermaid-dialog__control" data-mermaid-action="zoom-out" aria-label="Dézoomer">${ICON_ZOOM_OUT}</button>
    <output class="mermaid-dialog__scale" aria-live="polite">100 %</output>
    <button type="button" class="mermaid-dialog__control" data-mermaid-action="zoom-in" aria-label="Zoomer">${ICON_ZOOM_IN}</button>
    <button type="button" class="mermaid-dialog__control" data-mermaid-action="reset" aria-label="Ajuster à l'écran">${ICON_FIT}</button>
    <div class="mermaid-dialog__pan">
      <button type="button" class="mermaid-dialog__control" data-mermaid-action="pan-left" aria-label="Déplacer vers la gauche">${ICON_PAN_LEFT}</button>
      <button type="button" class="mermaid-dialog__control" data-mermaid-action="pan-up" aria-label="Déplacer vers le haut">${ICON_PAN_UP}</button>
      <button type="button" class="mermaid-dialog__control" data-mermaid-action="pan-down" aria-label="Déplacer vers le bas">${ICON_PAN_DOWN}</button>
      <button type="button" class="mermaid-dialog__control" data-mermaid-action="pan-right" aria-label="Déplacer vers la droite">${ICON_PAN_RIGHT}</button>
    </div>
    <button type="button" class="mermaid-dialog__control" data-mermaid-action="close" aria-label="Fermer">${ICON_CLOSE}</button>
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

function computeFitScale(natural: DOMRect, viewport: HTMLElement): number {
  if (!natural.width || !natural.height) {
    return 1;
  }

  const padding = 48;
  const scale = Math.min(
    (viewport.clientWidth - padding) / natural.width,
    (viewport.clientHeight - padding) / natural.height
  );

  return Math.min(8, Math.max(0.25, scale));
}

/** One dialog per page, created on first use and reused afterwards. */
export function createDiagramDialog(): DiagramDialog {
  let refs: DialogRefs | null = null;
  let panzoom: PanzoomObject | null = null;
  let home: { parent: Node; next: Node | null } | null = null;
  let currentSvg: SVGSVGElement | null = null;
  let fitScale = 1;

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

  function handleAction(action: string): void {
    if (!panzoom || !refs) {
      return;
    }

    switch (action) {
      case "zoom-in":
        panzoom.zoomIn();
        break;
      case "zoom-out":
        panzoom.zoomOut();
        break;
      case "reset":
        panzoom.reset();
        break;
      case "pan-up":
        panBy(0, PAN_STEP);
        break;
      case "pan-down":
        panBy(0, -PAN_STEP);
        break;
      case "pan-left":
        panBy(PAN_STEP, 0);
        break;
      case "pan-right":
        panBy(-PAN_STEP, 0);
        break;
      case "close":
        refs.dialog.close();
        break;
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!panzoom) {
      return;
    }

    switch (event.key) {
      case "+":
      case "=":
      case "Add":
        panzoom.zoomIn();
        break;
      case "-":
      case "_":
      case "Subtract":
        panzoom.zoomOut();
        break;
      case "0":
      case "Home":
        panzoom.reset();
        break;
      case "ArrowUp":
        panBy(0, PAN_STEP);
        break;
      case "ArrowDown":
        panBy(0, -PAN_STEP);
        break;
      case "ArrowLeft":
        panBy(PAN_STEP, 0);
        break;
      case "ArrowRight":
        panBy(-PAN_STEP, 0);
        break;
      default:
        return;
    }

    event.preventDefault();
  }

  function handleClose(): void {
    panzoom?.destroy();
    panzoom = null;

    if (currentSvg && home) {
      home.parent.insertBefore(currentSvg, home.next);
    }

    currentSvg = null;
    home = null;
    refs?.stage.replaceChildren();
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
        handleAction(action);
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

    svg.removeAttribute("style");
    elements.stage.replaceChildren(svg);
    elements.dialog.setAttribute("aria-label", input.title ?? "Diagramme");
    elements.dialog.showModal();
    document.documentElement.style.overflow = "hidden";

    const factory = await loadPanzoomFactory();
    const natural = svg.getBoundingClientRect();
    fitScale = computeFitScale(natural, elements.viewport);

    panzoom = factory(elements.stage, {
      maxScale: 8,
      minScale: 0.25,
      startScale: fitScale,
      contain: "inside",
      cursor: "grab",
      panOnlyWhenZoomed: true,
      touchAction: "none",
      animate: !prefersReducedMotion()
    });

    // Panzoom measures the element before the start scale is painted, so the
    // centering pan waits one frame and uses pan coordinates (pre-scale).
    requestAnimationFrame(() => {
      if (!panzoom) {
        return;
      }

      panzoom.pan(
        (elements.viewport.clientWidth - natural.width) / (2 * fitScale),
        (elements.viewport.clientHeight - natural.height) / (2 * fitScale),
        { force: true }
      );
    });

    elements.stage.addEventListener("panzoomchange", updateScale);
    updateScale();
    elements.viewport.focus();
  }

  function close(): void {
    refs?.dialog.close();
  }

  return { open, close };
}
