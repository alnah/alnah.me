import type { HastPluginDefinition } from "satteri";
import { SITE } from "../../config/site.ts";
import { EXTERNAL_ICON_CLASS, EXTERNAL_LINK_CLASS } from "../dom-hooks.ts";
import { externalLinkAttributes } from "../links.ts";
import { EXTERNAL_LINK_ICON, strokeIconHast } from "../svg-icons.ts";
import { classList, type HastElement } from "./hast.ts";

/** Decorative arrow that marks a link opening in a new tab. */
function externalLinkIcon(): HastElement {
  return strokeIconHast(EXTERNAL_LINK_ICON, {
    className: EXTERNAL_ICON_CLASS,
    ariaHidden: true
  });
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
