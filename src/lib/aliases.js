// @ts-check

/**
 * @param {string} alias
 * @returns {string}
 */
export function normalizeAlias(alias) {
  const trimmed = alias.trim();

  if (!trimmed) {
    return "";
  }

  if (
    /\s/.test(trimmed) ||
    trimmed.includes("\\") ||
    trimmed.startsWith("//") ||
    trimmed.includes("..") ||
    /[?#]/.test(trimmed)
  ) {
    throw new Error(`Invalid alias path: ${alias}`);
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const normalized = withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;

  if (!/^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*\/$/.test(normalized)) {
    throw new Error(`Invalid alias path: ${alias}`);
  }

  return normalized;
}

/**
 * @param {string} slug
 * @returns {string}
 */
export function canonicalPostPath(slug) {
  return `/articles/${slug}/`;
}
