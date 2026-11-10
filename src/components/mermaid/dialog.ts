import { createDragGuard } from "./drag.ts";
import { DIALOG_MARKUP, KEY_ACTIONS, type DiagramAction } from "./dialog-markup.ts";
import {
  copyDiagramSource,
  downloadDiagramSvg,
  type DiagramExport,
  type ExportFeedback
} from "./export-actions.ts";
import { startPanzoomSession, type PanzoomSession } from "./panzoom-session.ts";

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

type DialogRefs = {
  dialog: HTMLDialogElement;
  viewport: HTMLElement;
  stage: HTMLElement;
  scale: HTMLOutputElement;
  status: HTMLElement;
};

const PAN_STEP = 60;
const DRAG_THRESHOLD = 6;
const ZOOM_STEP = Math.exp(0.3);

/** One dialog per page, created on first use and reused afterwards. */
export function createDiagramDialog(): DiagramDialog {
  let refs: DialogRefs | null = null;
  let session: PanzoomSession | null = null;
  let home: { parent: Node; next: Node | null } | null = null;
  let currentSvg: SVGSVGElement | null = null;
  let currentTitle: string | null = null;
  let currentSource = "";
  let statusTimer = 0;
  const dragGuard = createDragGuard(DRAG_THRESHOLD);

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

  const feedback: ExportFeedback = {
    success: announce,
    failure: (message, error) => {
      announce(message);
      console.error("Mermaid export failed:", error);
    }
  };

  function exportContext(): DiagramExport | null {
    return currentSvg ? { svg: currentSvg, title: currentTitle, source: currentSource } : null;
  }

  function updateScale(scale: number, fitScale: number): void {
    if (!refs) {
      return;
    }

    refs.scale.value = `${Math.round(scale * 100)} %`;
    refs.dialog.dataset.zoomed = scale > fitScale + 0.01 ? "true" : "false";
  }

  const actions: Record<DiagramAction, () => void> = {
    "zoom-in": () => session?.zoomBy(ZOOM_STEP),
    "zoom-out": () => session?.zoomBy(1 / ZOOM_STEP),
    reset: () => session?.reset(),
    copy: () => {
      const diagram = exportContext();

      if (diagram) {
        void copyDiagramSource(diagram, feedback);
      }
    },
    download: () => {
      const diagram = exportContext();

      if (diagram) {
        downloadDiagramSvg(diagram, feedback);
      }
    },
    "pan-up": () => session?.panBy(0, PAN_STEP),
    "pan-down": () => session?.panBy(0, -PAN_STEP),
    "pan-left": () => session?.panBy(PAN_STEP, 0),
    "pan-right": () => session?.panBy(-PAN_STEP, 0),
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
    session?.destroy();
    session = null;

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
        session?.zoomWithWheel(event);
      },
      { passive: false }
    );
    viewport.addEventListener("pointerdown", (event) => {
      dragGuard.start(event.clientX, event.clientY);
    });
    viewport.addEventListener("pointermove", (event) => {
      dragGuard.move(event.clientX, event.clientY);
    });
    viewport.addEventListener("pointerup", () => {
      dragGuard.end();
    });
    viewport.addEventListener("pointercancel", () => {
      dragGuard.end();
    });
    viewport.addEventListener(
      "click",
      (event) => {
        // A drag that started on a link moves the diagram; only a real click
        // follows the link. Keyboard clicks have no pointer movement (detail 0).
        if (!dragGuard.consumesClick(event.detail)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
      },
      { capture: true }
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
    delete elements.dialog.dataset.error;
    elements.dialog.showModal();
    document.documentElement.style.overflow = "hidden";

    try {
      session = await startPanzoomSession(elements.stage, elements.viewport, svg, updateScale);
    } catch (error) {
      // Keep the diagram reachable at its natural size instead of a blank modal.
      console.error("Mermaid dialog failed to open:", error);
      elements.dialog.dataset.error = "true";
      elements.dialog.dataset.ready = "true";
      elements.viewport.focus();
      announce("Zoom indisponible");
      return;
    }

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
