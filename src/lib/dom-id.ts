/**
 * Stable id suffix derived from a page path, so repeated builds emit the same
 * DOM ids. Separators collapse to dashes and the home page falls back to
 * "home".
 */
export function pageIdSuffix(pathname: string) {
  const normalized = pathname
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "home";
}
