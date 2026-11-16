import { parse, type DefaultTreeAdapterMap } from "parse5";

/** Minimal DOM helpers for assertions over built pages. */
export type PageDocument = DefaultTreeAdapterMap["document"];
export type PageElement = DefaultTreeAdapterMap["element"];
export type PageNode = DefaultTreeAdapterMap["node"];

export function parsePage(html: string): PageDocument {
  return parse(html);
}

function childrenOf(node: PageNode | PageDocument): PageNode[] {
  return "childNodes" in node ? (node.childNodes as PageNode[]) : [];
}

export function elements(
  root: PageNode | PageDocument,
  predicate: (element: PageElement) => boolean
): PageElement[] {
  const found: PageElement[] = [];

  for (const child of childrenOf(root)) {
    if (child.nodeName === "#comment") {
      continue;
    }

    if ("tagName" in child && predicate(child as PageElement)) {
      found.push(child as PageElement);
    }

    found.push(...elements(child, predicate));
  }

  return found;
}

export function byTag(root: PageNode | PageDocument, tagName: string) {
  return elements(root, (element) => element.tagName === tagName);
}

export function attr(element: PageElement, name: string) {
  return element.attrs.find((attribute) => attribute.name === name)?.value;
}

export function hasClass(element: PageElement, name: string) {
  return (attr(element, "class") ?? "").split(/\s+/).includes(name);
}

export function textContent(node: PageNode | PageDocument): string {
  if ("value" in node) {
    return node.value;
  }

  return childrenOf(node)
    .map((child) => textContent(child))
    .join("");
}

/** JSON-LD payloads, in document order. */
export function jsonLd(doc: PageDocument): Record<string, unknown>[] {
  return byTag(doc, "script")
    .filter((script) => attr(script, "type") === "application/ld+json")
    .map((script) => JSON.parse(textContent(script)) as Record<string, unknown>);
}

/** Anchor targets, including absolute links back to the site. */
export function anchorHrefs(doc: PageDocument) {
  return byTag(doc, "a")
    .map((anchor) => attr(anchor, "href"))
    .filter((href): href is string => Boolean(href));
}

export function normalizeText(value: string) {
  return value
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
