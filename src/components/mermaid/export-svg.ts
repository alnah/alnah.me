import type { DiagramAttribution } from "./attribution.ts";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

export type DiagramColors = {
  background: string;
  foreground: string;
};

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Lowercase, accent-free SVG file name for an exported diagram. */
export function diagramFileName(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "diagramme"}.svg`;
}

function readBox(svg: SVGSVGElement): Box {
  const viewBox = svg
    .getAttribute("viewBox")
    ?.trim()
    .split(/\s+/)
    .map(Number);

  if (viewBox?.length === 4 && viewBox.every((value) => Number.isFinite(value))) {
    return { x: viewBox[0], y: viewBox[1], width: viewBox[2], height: viewBox[3] };
  }

  const rect = svg.getBoundingClientRect();

  return {
    x: 0,
    y: 0,
    width: Number(svg.getAttribute("width")) || rect.width || 640,
    height: Number(svg.getAttribute("height")) || rect.height || 480
  };
}

function setAttributes(element: Element, attributes: Record<string, string | number>): void {
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
}

function createText(options: {
  x: number;
  y: number;
  size: number;
  weight: string;
  fill: string;
  opacity?: string;
  value: string;
}): SVGTextElement {
  const text = document.createElementNS(SVG_NS, "text");
  setAttributes(text, {
    x: options.x,
    y: options.y,
    "font-family": "sans-serif",
    "font-size": options.size,
    "font-weight": options.weight,
    fill: options.fill
  });

  if (options.opacity) {
    text.setAttribute("opacity", options.opacity);
  }

  text.textContent = options.value;

  return text;
}

/**
 * Clone the rendered SVG into a standalone file: a background rect for the
 * current theme, then a footer with the diagram title and the attribution,
 * including a clickable CC BY 4.0 link.
 */
export function buildAttributedSvg(
  svg: SVGSVGElement,
  attribution: DiagramAttribution,
  colors: DiagramColors
): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", SVG_NS);

  const box = readBox(clone);
  const padding = Math.max(16, box.width * 0.03);
  const footer = Math.max(56, box.height * 0.12);
  const credit = [attribution.author, attribution.siteName, attribution.date]
    .filter(Boolean)
    .join(" · ");
  const estimatedWidth =
    Math.max(attribution.title.length, credit.length + attribution.licenseName.length + 4) *
    footer *
    0.22 *
    0.62;
  const width = Math.max(box.width, estimatedWidth + padding * 2);
  const height = box.height + footer;

  clone.setAttribute("viewBox", `${box.x} ${box.y} ${width} ${height}`);
  clone.setAttribute("width", String(Math.round(width)));
  clone.setAttribute("height", String(Math.round(height)));

  const background = document.createElementNS(SVG_NS, "rect");
  setAttributes(background, {
    x: box.x,
    y: box.y,
    width,
    height,
    fill: colors.background
  });
  clone.insertBefore(background, clone.firstChild);

  const title = createText({
    x: box.x + padding,
    y: box.y + box.height + footer * 0.44,
    size: footer * 0.3,
    weight: "600",
    fill: colors.foreground,
    value: attribution.title
  });

  const creditText = createText({
    x: box.x + padding,
    y: box.y + box.height + footer * 0.82,
    size: footer * 0.22,
    weight: "400",
    fill: colors.foreground,
    opacity: "0.75",
    value: `${credit} · `
  });
  const licenseLink = document.createElementNS(SVG_NS, "a");
  licenseLink.setAttribute("href", attribution.licenseUrl);
  licenseLink.setAttributeNS(XLINK_NS, "xlink:href", attribution.licenseUrl);
  licenseLink.textContent = attribution.licenseName;
  creditText.append(licenseLink);

  clone.append(title, creditText);

  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
}
