import { SITE } from "../../config/site";
import { EXTERNAL_LINK_ICON_PATHS, externalLinkAttributes } from "../../lib/links";
import { createTokenReader } from "./theme";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const ICON_CLASS = "mermaid-external-icon";
const ICON_SIZE_PX = 7;
const ICON_INSET_PX = 4;
/** The shared paths draw inside a 24 box, spanning 4..20 on both axes. */
const ICON_GLYPH_LEFT = 4;
const ICON_GLYPH_CENTER_Y = 12;
const ICON_GLYPH_SIZE = 16;

type IconEntry = {
  icon: SVGGElement;
  node: SVGGraphicsElement;
};

/** Icons per diagram, so a resize can re-scale them without re-rendering. */
const tracked = new Map<SVGSVGElement, IconEntry[]>();
let listening = false;

function anchorHref(anchor: Element): string | null {
  return anchor.getAttribute("href") ?? anchor.getAttributeNS(XLINK_NS, "href");
}

function iconPaths(container: SVGElement | HTMLElement): void {
  for (const d of EXTERNAL_LINK_ICON_PATHS) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    container.appendChild(path);
  }
}

/** Corner-up arrow for an SVG node, before the per-diagram scale is applied. */
function svgIcon(stroke: string): SVGGElement {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", ICON_CLASS);
  group.setAttribute("aria-hidden", "true");
  group.setAttribute("fill", "none");
  group.setAttribute("stroke", stroke);
  group.setAttribute("stroke-width", "2");
  group.setAttribute("stroke-linecap", "round");
  group.setAttribute("stroke-linejoin", "round");
  iconPaths(group);

  return group;
}

/** Corner-up arrow for an HTML label, sized like the prose icon. */
function htmlIcon(): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "external-link-icon";
  span.setAttribute("aria-hidden", "true");

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  iconPaths(svg);

  span.appendChild(svg);

  return span;
}

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Union of the client rects of every non-blank text node below `element`.
 * Unlike a range over the element contents, block children do not widen it.
 */
function textExtent(element: Element): DOMRect | null {
  const range = document.createRange();
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let extent: DOMRect | null = null;
  let node = walker.nextNode();

  while (node) {
    const text = node.nodeValue ?? "";

    if (text.trim()) {
      range.setStart(node, 0);
      range.setEnd(node, text.length);
      const rect = range.getBoundingClientRect();

      if (rect.width && rect.height) {
        extent = extent
          ? new DOMRect(
              Math.min(extent.left, rect.left),
              Math.min(extent.top, rect.top),
              Math.max(extent.right, rect.right) - Math.min(extent.left, rect.left),
              Math.max(extent.bottom, rect.bottom) - Math.min(extent.top, rect.top)
            )
          : rect;
      }
    }

    node = walker.nextNode();
  }

  return extent;
}

/**
 * Label box in the node's coordinate space. Uses the rendered text extent so a
 * left-aligned label reports the text end, not the full node width.
 */
function labelBox(node: SVGGraphicsElement): Box {
  const label =
    node.querySelector<SVGGraphicsElement>(".nodeLabel") ??
    node.querySelector<SVGGraphicsElement>(".label");
  const ctm = node.getScreenCTM();

  if (!label || !ctm) {
    return node.getBBox();
  }

  const rect = textExtent(label);

  if (!rect) {
    return node.getBBox();
  }

  const inverse = ctm.inverse();
  const start = new DOMPoint(rect.left, rect.top).matrixTransform(inverse);
  const end = new DOMPoint(rect.right, rect.bottom).matrixTransform(inverse);

  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y)
  };
}

/**
 * The SVG is displayed at `max-width: 100%`, so the icon must be sized in user
 * units that render at a constant pixel size whatever the diagram scale.
 */
function layoutIcons(svg: SVGSVGElement, entries: IconEntry[]): void {
  const viewBoxWidth = svg.viewBox.baseVal.width;
  const renderedWidth = svg.getBoundingClientRect().width;
  const displayScale = viewBoxWidth > 0 && renderedWidth > 0 ? renderedWidth / viewBoxWidth : 1;
  const glyph = ICON_SIZE_PX / displayScale;
  const scale = glyph / ICON_GLYPH_SIZE;
  const inset = ICON_INSET_PX / displayScale;

  for (const { icon, node } of entries) {
    const box = labelBox(node);
    const x = box.x + box.width + inset - ICON_GLYPH_LEFT * scale;
    const y = box.y + box.height / 2 - ICON_GLYPH_CENTER_Y * scale;
    icon.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
  }
}

function relayoutAll(): void {
  for (const [svg, entries] of tracked) {
    if (!svg.isConnected) {
      tracked.delete(svg);
      continue;
    }

    // In the dialog the SVG is panzoom-transformed; its inline size is kept.
    if (svg.closest(".mermaid-dialog")) {
      continue;
    }

    layoutIcons(svg, entries);
  }
}

/**
 * Mark external links in a rendered diagram: new tab, noopener, an accessible
 * name that announces the new tab, and a small corner-up arrow after the link
 * or its label. Internal links are left untouched.
 */
export function markExternalDiagramLinks(svg: SVGSVGElement): void {
  const readVar = createTokenReader(document.documentElement);
  const stroke = readVar("--color-link") || "currentColor";
  const entries: IconEntry[] = [];

  for (const anchor of svg.querySelectorAll<Element>("a")) {
    const href = anchorHref(anchor);

    if (!href) {
      continue;
    }

    const attributes = externalLinkAttributes(href, SITE.siteUrl, anchor.textContent ?? "");

    if (!attributes) {
      continue;
    }

    if (!anchor.getAttribute("target")) {
      anchor.setAttribute("target", attributes.target);
    }

    if (!anchor.getAttribute("rel")) {
      anchor.setAttribute("rel", attributes.rel);
    }

    if (!anchor.getAttribute("aria-label")) {
      anchor.setAttribute("aria-label", attributes.ariaLabel);
    }

    // Raw HTML anchors live inside a label: put the arrow right after the text.
    if (anchor instanceof HTMLAnchorElement) {
      anchor.appendChild(htmlIcon());
      continue;
    }

    const node =
      anchor.querySelector<SVGGraphicsElement>(".node") ??
      anchor.closest<SVGGraphicsElement>(".node");

    if (!node || node.querySelector(`.${ICON_CLASS}`)) {
      continue;
    }

    const icon = svgIcon(stroke);
    node.appendChild(icon);
    entries.push({ icon, node });
  }

  if (entries.length === 0) {
    return;
  }

  layoutIcons(svg, entries);
  tracked.set(svg, entries);

  if (!listening) {
    listening = true;
    window.addEventListener("resize", relayoutAll);
  }
}
