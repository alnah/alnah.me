import type { HastElement } from "./markdown/hast.ts";

/** One SVG primitive inside an icon: a tag with presentation attributes. */
export type SvgShape = {
  tag: "path" | "circle" | "line" | "rect" | "polyline";
  attrs: Record<string, string>;
};

/** Stroke icon drawn in its viewBox: geometry plus the shared stroke style. */
export type StrokeIcon = {
  /** Stable name, used for class hooks and file names. */
  name: string;
  viewBox: string;
  /** Rendered size in px, matching the icon scale. */
  size: number;
  shapes: readonly SvgShape[];
};

export type IconOptions = {
  className?: string;
  ariaHidden?: boolean;
  /** Stroke color: a CSS color or "currentColor". */
  stroke?: string;
};

const SVG_NS = "http://www.w3.org/2000/svg";
const STROKE_WIDTH = "2";

export const EXTERNAL_LINK_ICON: StrokeIcon = {
  name: "external-link",
  viewBox: "0 0 24 24",
  size: 16,
  shapes: [
    { tag: "path", attrs: { d: "M10 9 15 4 20 9" } },
    { tag: "path", attrs: { d: "M4 20h7a4 4 0 0 0 4-4V4" } }
  ]
};

export const BACKLINK_ICON: StrokeIcon = {
  name: "backlink",
  viewBox: "0 0 24 24",
  size: 16,
  shapes: [
    { tag: "path", attrs: { d: "M9 14 4 9l5-5" } },
    { tag: "path", attrs: { d: "M4 9h10a6 6 0 0 1 6 6v5" } }
  ]
};

export const ZOOM_IN_ICON: StrokeIcon = {
  name: "zoom-in",
  viewBox: "0 0 24 24",
  size: 18,
  shapes: [
    { tag: "circle", attrs: { cx: "11", cy: "11", r: "7" } },
    { tag: "line", attrs: { x1: "21", y1: "21", x2: "16.7", y2: "16.7" } },
    { tag: "line", attrs: { x1: "11", y1: "8", x2: "11", y2: "14" } },
    { tag: "line", attrs: { x1: "8", y1: "11", x2: "14", y2: "11" } }
  ]
};

export const ZOOM_OUT_ICON: StrokeIcon = {
  name: "zoom-out",
  viewBox: "0 0 24 24",
  size: 18,
  shapes: [
    { tag: "circle", attrs: { cx: "11", cy: "11", r: "7" } },
    { tag: "line", attrs: { x1: "21", y1: "21", x2: "16.7", y2: "16.7" } },
    { tag: "line", attrs: { x1: "8", y1: "11", x2: "14", y2: "11" } }
  ]
};

export const FIT_ICON: StrokeIcon = {
  name: "fit",
  viewBox: "0 0 24 24",
  size: 18,
  shapes: [
    { tag: "path", attrs: { d: "M8 3H5a2 2 0 0 0-2 2v3" } },
    { tag: "path", attrs: { d: "M16 3h3a2 2 0 0 1 2 2v3" } },
    { tag: "path", attrs: { d: "M8 21H5a2 2 0 0 1-2-2v-3" } },
    { tag: "path", attrs: { d: "M16 21h3a2 2 0 0 0 2-2v-3" } }
  ]
};

export const CLOSE_ICON: StrokeIcon = {
  name: "close",
  viewBox: "0 0 24 24",
  size: 18,
  shapes: [
    { tag: "line", attrs: { x1: "18", y1: "6", x2: "6", y2: "18" } },
    { tag: "line", attrs: { x1: "6", y1: "6", x2: "18", y2: "18" } }
  ]
};

export const COPY_ICON: StrokeIcon = {
  name: "copy",
  viewBox: "0 0 24 24",
  size: 18,
  shapes: [
    { tag: "rect", attrs: { x: "9", y: "9", width: "12", height: "12", rx: "2" } },
    { tag: "path", attrs: { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" } }
  ]
};

export const DOWNLOAD_ICON: StrokeIcon = {
  name: "download",
  viewBox: "0 0 24 24",
  size: 18,
  shapes: [
    { tag: "path", attrs: { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" } },
    { tag: "polyline", attrs: { points: "7 10 12 15 17 10" } },
    { tag: "line", attrs: { x1: "12", y1: "15", x2: "12", y2: "3" } }
  ]
};

export const PAN_UP_ICON: StrokeIcon = {
  name: "pan-up",
  viewBox: "0 0 24 24",
  size: 16,
  shapes: [{ tag: "polyline", attrs: { points: "6 15 12 9 18 15" } }]
};

export const PAN_DOWN_ICON: StrokeIcon = {
  name: "pan-down",
  viewBox: "0 0 24 24",
  size: 16,
  shapes: [{ tag: "polyline", attrs: { points: "6 9 12 15 18 9" } }]
};

export const PAN_LEFT_ICON: StrokeIcon = {
  name: "pan-left",
  viewBox: "0 0 24 24",
  size: 16,
  shapes: [{ tag: "polyline", attrs: { points: "15 6 9 12 15 18" } }]
};

export const PAN_RIGHT_ICON: StrokeIcon = {
  name: "pan-right",
  viewBox: "0 0 24 24",
  size: 16,
  shapes: [{ tag: "polyline", attrs: { points: "9 6 15 12 9 18" } }]
};

export const EXPAND_ICON: StrokeIcon = {
  name: "expand",
  viewBox: "0 0 24 24",
  size: 16,
  shapes: [
    { tag: "polyline", attrs: { points: "15 3 21 3 21 9" } },
    { tag: "polyline", attrs: { points: "9 21 3 21 3 15" } },
    { tag: "line", attrs: { x1: "21", y1: "3", x2: "14", y2: "10" } },
    { tag: "line", attrs: { x1: "3", y1: "21", x2: "10", y2: "14" } }
  ]
};

function shapeMarkup(shape: SvgShape): string {
  const attrs = Object.entries(shape.attrs)
    .map(([name, value]) => ` ${name}="${value}"`)
    .join("");

  return `<${shape.tag}${attrs}></${shape.tag}>`;
}

/** Inline SVG markup for server-rendered controls. */
export function strokeIconMarkup(
  icon: StrokeIcon,
  options: IconOptions = {}
): string {
  const {
    className,
    ariaHidden = true,
    stroke = "currentColor"
  } = options;
  const attrs = [
    `width="${icon.size}"`,
    `height="${icon.size}"`,
    `viewBox="${icon.viewBox}"`,
    'fill="none"',
    `stroke="${stroke}"`,
    `stroke-width="${STROKE_WIDTH}"`,
    'stroke-linecap="round"',
    'stroke-linejoin="round"',
    ariaHidden ? 'aria-hidden="true"' : "",
    className ? `class="${className}"` : ""
  ]
    .filter(Boolean)
    .join(" ");

  return `<svg ${attrs}>${icon.shapes.map(shapeMarkup).join("")}</svg>`;
}

function hastShape(shape: SvgShape): HastElement {
  return {
    type: "element",
    tagName: shape.tag,
    properties: { ...shape.attrs },
    children: []
  };
}

/** Hast node for the Markdown pipeline, wrapped in its decorative span. */
export function strokeIconHast(
  icon: StrokeIcon,
  options: IconOptions = {}
): HastElement {
  const {
    className,
    ariaHidden = true,
    stroke = "currentColor"
  } = options;

  return {
    type: "element",
    tagName: "span",
    properties: {
      ...(className ? { className: [className] } : {}),
      ...(ariaHidden ? { ariaHidden: "true" } : {})
    },
    children: [
      {
        type: "element",
        tagName: "svg",
        properties: {
          viewBox: icon.viewBox,
          fill: "none",
          stroke,
          strokeWidth: STROKE_WIDTH,
          strokeLinecap: "round",
          strokeLinejoin: "round"
        },
        children: icon.shapes.map(hastShape)
      }
    ]
  };
}

function appendShapes(container: SVGElement, icon: StrokeIcon): void {
  for (const shape of icon.shapes) {
    const element = document.createElementNS(SVG_NS, shape.tag);

    for (const [name, value] of Object.entries(shape.attrs)) {
      element.setAttribute(name, value);
    }

    container.appendChild(element);
  }
}

/** SVG element for an HTML label, sized by CSS like the prose icon. */
export function strokeIconSvgDom(
  icon: StrokeIcon,
  document: Document,
  options: IconOptions = {}
): SVGSVGElement {
  const {
    className,
    ariaHidden = false,
    stroke = "currentColor"
  } = options;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", icon.viewBox);
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", stroke);
  svg.setAttribute("stroke-width", STROKE_WIDTH);
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  if (ariaHidden) {
    svg.setAttribute("aria-hidden", "true");
  }

  if (className) {
    svg.setAttribute("class", className);
  }

  appendShapes(svg, icon);

  return svg;
}

/** SVG group for a diagram node, before the per-diagram scale is applied. */
export function strokeIconGroupDom(
  icon: StrokeIcon,
  document: Document,
  options: IconOptions = {}
): SVGGElement {
  const {
    className,
    ariaHidden = true,
    stroke = "currentColor"
  } = options;
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("fill", "none");
  group.setAttribute("stroke", stroke);
  group.setAttribute("stroke-width", STROKE_WIDTH);
  group.setAttribute("stroke-linecap", "round");
  group.setAttribute("stroke-linejoin", "round");

  if (className) {
    group.setAttribute("class", className);
  }

  if (ariaHidden) {
    group.setAttribute("aria-hidden", "true");
  }

  appendShapes(group, icon);

  return group;
}
