import type { HastPluginDefinition } from "satteri";
import { BACKLINK_ICON_PATHS } from "../links.ts";
import { classList, type HastElement } from "./hast.ts";

const FOOTNOTE_REF_CLASS = "footnote-ref";
const FOOTNOTE_BACKREF_CLASS = "footnote-backref";
const FOOTNOTE_ICON_CLASS = "footnote-backref-icon";
const FOOTNOTE_LABEL_ID = "footnote-label";
const BACKLINK_LABEL_PATTERN = /^Back to reference (.+)$/;

function meaningfulChildren(node: HastElement) {
  return node.children.filter((child) => child.type !== "text" || child.value.trim());
}

/** Return the sole footnote reference link wrapped by a `sup`. */
function footnoteRef(node: HastElement): HastElement | null {
  const children = meaningfulChildren(node);

  if (children.length !== 1) {
    return null;
  }

  const child = children[0];

  if (
    child.type !== "element" ||
    child.tagName !== "a" ||
    child.properties?.dataFootnoteRef !== true
  ) {
    return null;
  }

  return child;
}

function withClasses(node: HastElement, ...classes: string[]) {
  return [...new Set([...classList(node), ...classes])];
}

function backlinkIcon(): HastElement {
  return {
    type: "element",
    tagName: "span",
    properties: { className: [FOOTNOTE_ICON_CLASS], ariaHidden: "true" },
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
        children: BACKLINK_ICON_PATHS.map((d) => ({
          type: "element" as const,
          tagName: "path",
          properties: { d },
          children: []
        }))
      }
    ]
  };
}

/**
 * Turn Satteri's default footnote markup into the site's accessible French
 * variant: no `<sup>` wrapper, a visually hidden `Notes` label, and a
 * localized backlink with the shared return-arrow icon.
 */
export function footnotes(): HastPluginDefinition {
  return {
    name: "footnotes",
    element: {
      filter: ["sup", "section", "h2", "a"],
      visit(node) {
        if (node.tagName === "sup") {
          const ref = footnoteRef(node);

          if (!ref) {
            return;
          }

          const properties = { ...ref.properties };
          delete properties.ariaDescribedBy;

          const number = ref.children.find((child) => child.type === "text")?.value ?? "";

          return {
            ...ref,
            properties: {
              ...properties,
              className: withClasses(ref, FOOTNOTE_REF_CLASS),
              ariaLabel: `Note ${number}`,
              role: "doc-noteref"
            }
          };
        }

        if (node.properties?.dataFootnotes === true) {
          return {
            ...node,
            properties: {
              ...node.properties,
              role: "doc-endnotes"
            }
          };
        }

        if (node.tagName === "h2" && node.properties?.id === FOOTNOTE_LABEL_ID) {
          return { type: "text", value: "" };
        }

        if (node.properties?.dataFootnoteBackref === undefined) {
          return;
        }

        const label = `${node.properties.ariaLabel ?? ""}`;
        const reference = label.match(BACKLINK_LABEL_PATTERN)?.[1];

        return {
          ...node,
          properties: {
            ...node.properties,
            className: withClasses(node, FOOTNOTE_BACKREF_CLASS),
            ariaLabel: reference ? `Retour au texte, note ${reference}` : "Retour au texte",
            role: "doc-backlink"
          },
          children: [backlinkIcon()]
        };
      }
    }
  };
}
