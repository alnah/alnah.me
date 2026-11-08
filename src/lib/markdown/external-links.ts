import type { HastPluginDefinition } from "satteri";
import { SITE } from "../../config/site";
import { EXTERNAL_LINK_ICON_PATHS, externalLinkAttributes } from "../links";
import { classList, type HastElement } from "./hast";

const EXTERNAL_LINK_CLASS = "external-link";
const EXTERNAL_ICON_CLASS = "external-link-icon";

/** Decorative arrow that marks a link opening in a new tab. */
function externalLinkIcon(): HastElement {
  return {
    type: "element",
    tagName: "span",
    properties: { className: [EXTERNAL_ICON_CLASS], ariaHidden: "true" },
    children: [
      {
        type: "element",
        tagName: "svg",
        properties: {
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        },
        children: [
          ...EXTERNAL_LINK_ICON_PATHS.map((d) => ({
            type: "element" as const,
            tagName: "path",
            properties: { d },
            children: []
          }))
        ]
      }
    ]
  };
}

/**
 * Mark every external link in Markdown content: new tab, noopener, an
 * accessible name that announces the new tab, and a decorative arrow.
 * Internal links, anchors, and mailto/tel targets are left untouched, and an
 * author-provided target, rel, or aria-label wins.
 */
export function externalLinks(): HastPluginDefinition {
  return {
    name: "external-links",
    element: {
      filter: ["a"],
      visit(node, ctx) {
        const href = node.properties?.href;

        if (typeof href !== "string") {
          return;
        }

        const classes = classList(node);

        if (classes.includes(EXTERNAL_LINK_CLASS)) {
          return;
        }

        const attributes = externalLinkAttributes(href, SITE.siteUrl, ctx.textContent(node));

        if (!attributes) {
          return;
        }

        return {
          type: "element",
          tagName: "a",
          properties: {
            ...node.properties,
            className: [...classes, EXTERNAL_LINK_CLASS],
            target: node.properties?.target ?? attributes.target,
            rel: node.properties?.rel ?? [attributes.rel],
            ariaLabel: node.properties?.ariaLabel ?? attributes.ariaLabel
          },
          children: [...node.children, externalLinkIcon()]
        };
      }
    }
  };
}
