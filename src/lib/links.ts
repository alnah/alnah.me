/** Suffix added to the accessible name of links that open a new tab. */
export const NEW_TAB_NOTE = " (s'ouvre dans un nouvel onglet)";

/**
 * Corner-up arrow on a 24x24 viewBox: tail at the bottom left, right, rounded
 * corner, then up. Shared by the Markdown plugin and the diagram runtime.
 */
export const EXTERNAL_LINK_ICON_PATHS = ["M10 9 15 4 20 9", "M4 20h7a4 4 0 0 0 4-4V4"] as const;

export type LinkKind = "external" | "internal" | "ignore";

/**
 * Classify a link target against the site origin. Relative targets, anchors,
 * and same-origin absolute URLs are internal; other http(s) hosts are
 * external; non-web protocols such as mailto and tel are ignored.
 */
export function classifyLink(href: string, origin: string): LinkKind {
  let url: URL;

  try {
    url = new URL(href, origin);
  } catch {
    return "ignore";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "ignore";
  }

  return url.origin === new URL(origin).origin ? "internal" : "external";
}

export type ExternalLinkAttributes = {
  target: string;
  rel: string;
  ariaLabel: string;
};

/**
 * Attributes for an external link that opens in a new tab, or null when the
 * target is internal or not a web link. The accessible name keeps the visible
 * label and appends the new-tab note.
 */
export function externalLinkAttributes(
  href: string,
  origin: string,
  label: string
): ExternalLinkAttributes | null {
  if (classifyLink(href, origin) !== "external") {
    return null;
  }

  return {
    target: "_blank",
    rel: "noopener",
    ariaLabel: `${label.trim()}${NEW_TAB_NOTE}`
  };
}
