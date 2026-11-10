import type { PanzoomObject } from "@panzoom/panzoom";
import { computeFitScale, MAX_SCALE, MIN_SCALE, readNaturalSize } from "./viewport.ts";

type PanzoomFactory = typeof import("@panzoom/panzoom").default;

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

export type PanzoomSession = {
  zoomBy(factor: number): void;
  zoomWithWheel(event: WheelEvent): void;
  panBy(x: number, y: number): void;
  reset(): void;
  destroy(): void;
  fitScale: number;
};

/**
 * Start a panzoom session for one SVG, centered and fitted in the viewport.
 * The caller owns the stage and viewport elements; this module owns the
 * panzoom instance, its scale listener, and the teardown.
 */
export async function startPanzoomSession(
  stage: HTMLElement,
  viewport: HTMLElement,
  svg: SVGSVGElement,
  onScale: (scale: number, fitScale: number) => void
): Promise<PanzoomSession> {
  const factory = await loadPanzoomFactory();
  const natural = readNaturalSize(svg);
  const fitScale = computeFitScale(natural, viewport);
  const minScale = Math.max(MIN_SCALE, fitScale / 2);
  const startX = (viewport.clientWidth - natural.width) / (2 * fitScale);
  const startY = (viewport.clientHeight - natural.height) / (2 * fitScale);

  // No `contain`: panzoom caps the max scale at the fit scale when contained,
  // which blocks zooming in. Centering is passed as the reset position.
  const panzoom: PanzoomObject = factory(stage, {
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

  const reportScale = () => onScale(panzoom.getScale(), fitScale);
  stage.addEventListener("panzoomchange", reportScale);
  reportScale();

  return {
    zoomBy(factor) {
      const next = Math.min(MAX_SCALE, Math.max(minScale, panzoom.getScale() * factor));
      const rect = viewport.getBoundingClientRect();

      panzoom.zoomToPoint(next, {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      });
    },
    zoomWithWheel(event) {
      panzoom.zoomWithWheel(event);
    },
    panBy(x, y) {
      panzoom.pan(x, y, { relative: true });
    },
    reset() {
      panzoom.reset();
    },
    destroy() {
      stage.removeEventListener("panzoomchange", reportScale);
      panzoom.resetStyle();
      panzoom.destroy();
    },
    fitScale
  };
}
