export type NaturalSize = {
  width: number;
  height: number;
};

export type ViewportSize = {
  clientWidth: number;
  clientHeight: number;
};

/** Smallest scale the dialog allows. */
export const MIN_SCALE = 0.05;
/** Largest scale the dialog allows. */
export const MAX_SCALE = 8;

const FIT_PADDING = 48;

/**
 * Natural SVG size from its width and height attributes, falling back to the
 * rendered box when they are missing or invalid.
 */
export function readNaturalSize(svg: SVGSVGElement): NaturalSize {
  const width = Number(svg.getAttribute("width"));
  const height = Number(svg.getAttribute("height"));

  if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
    return { width, height };
  }

  const rect = svg.getBoundingClientRect();

  return { width: rect.width, height: rect.height };
}

/**
 * Scale that fits the diagram in the viewport with breathing room, clamped
 * between MIN_SCALE and MAX_SCALE. Falls back to 1 for a size-less diagram.
 */
export function computeFitScale(natural: NaturalSize, viewport: ViewportSize): number {
  if (!natural.width || !natural.height) {
    return 1;
  }

  const scale = Math.min(
    (viewport.clientWidth - FIT_PADDING) / natural.width,
    (viewport.clientHeight - FIT_PADDING) / natural.height
  );

  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}
