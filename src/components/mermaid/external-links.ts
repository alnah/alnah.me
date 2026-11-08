import { SITE } from "../../config/site";
import { EXTERNAL_LINK_ICON_PATHS, externalLinkAttributes } from "../../lib/links";
import { createTokenReader } from "./theme";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const ICON_CLASS = "mermaid-external-icon";
const ICON_SIZE = 10;

function anchorHref(anchor: Element): string | null {
  return anchor.getAttribute("href") ?? anchor.getAttributeNS(XLINK_NS, "href");
}

/** Corner-up arrow as an SVG group, scaled to `ICON_SIZE`. */
function externalIcon(stroke: string): SVGGElement {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", ICON_CLASS);
  group.setAttribute("aria-hidden", "true");
  group.setAttribute("fill", "none");
  group.setAttribute("stroke", stroke);
  group.setAttribute("stroke-width", "2");
  group.setAttribute("stroke-linecap", "round");
  group.setAttribute("stroke-linejoin", "round");
  group.setAttribute("transform", `scale(${ICON_SIZE / 24})`);

  for (const d of EXTERNAL_LINK_ICON_PATHS) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    group.appendChild(path);
  }

  return group;
}

/**
 * Mark external links in a rendered diagram: new tab, noopener, an accessible
 * name that announces the new tab, and a small corner-up arrow next to the
 * label. Internal links are left untouched.
 */
export function markExternalDiagramLinks(svg: SVGSVGElement): void {
  const readVar = createTokenReader(document.documentElement);
  const stroke = readVar("--color-link") || "currentColor";

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

    const node =
      anchor.querySelector<SVGGraphicsElement>(".node") ??
      anchor.closest<SVGGraphicsElement>(".node");

    if (!node || node.querySelector(`.${ICON_CLASS}`)) {
      continue;
    }

    const box = node.getBBox();
    const icon = externalIcon(stroke);
    const x = box.x + box.width - ICON_SIZE - 4;
    const y = box.y + (box.height - ICON_SIZE) / 2;
    icon.setAttribute("transform", `translate(${x}, ${y}) scale(${ICON_SIZE / 24})`);
    node.appendChild(icon);
  }
}
