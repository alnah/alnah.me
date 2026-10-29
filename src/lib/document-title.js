// @ts-check

const LEADING_MARKDOWN_TITLE_PATTERN = /^(?:\uFEFF)?\s*#\s+(.+?)\s*#*\s*(?:\r?\n|$)/;

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeTitle(value) {
  return `${value ?? ""}`.replace(/\s+/g, " ").trim();
}

/**
 * @param {string} markdown
 * @returns {string | null}
 */
export function extractLeadingMarkdownTitle(markdown) {
  const match = `${markdown ?? ""}`.match(LEADING_MARKDOWN_TITLE_PATTERN);
  return match?.[1]?.trim() || null;
}

/**
 * We keep frontmatter and the leading H1 in lockstep so the rendered page, RSS,
 * search index, and raw reusable Markdown all describe the post the same way.
 *
 * @param {string} markdown
 * @param {string} fallbackTitle
 * @param {{ label?: string; requireLeadingTitle?: boolean }} [options]
 * @returns {string}
 */
export function validateMarkdownTitle(markdown, fallbackTitle, options = {}) {
  const { label = "Markdown document", requireLeadingTitle = false } = options;
  const normalizedFallbackTitle = normalizeTitle(fallbackTitle);

  if (!normalizedFallbackTitle) {
    throw new Error(`${label} is missing a frontmatter title`);
  }

  const markdownTitle = extractLeadingMarkdownTitle(markdown);

  if (!markdownTitle) {
    if (requireLeadingTitle) {
      throw new Error(`${label} is missing a leading H1 matching "${normalizedFallbackTitle}"`);
    }

    return normalizedFallbackTitle;
  }

  const normalizedMarkdownTitle = normalizeTitle(markdownTitle);

  if (normalizedMarkdownTitle !== normalizedFallbackTitle) {
    throw new Error(
      `${label} has frontmatter title "${normalizedFallbackTitle}" but leading H1 "${normalizedMarkdownTitle}"`
    );
  }

  return markdownTitle;
}

/**
 * Most callers already have the Astro content entry, so this helper keeps title
 * resolution consistent instead of repeating body/frontmatter wiring everywhere.
 *
 * @param {{ body?: string | null; data: { title: string } }} entry
 * @returns {string}
 */
export function resolveEntryTitle(entry) {
  return validateMarkdownTitle(entry.body ?? "", entry.data.title);
}

/**
 * Reading time, search excerpts, and list previews should not repeat the visible
 * H1 because the layout already renders it once at the document boundary.
 *
 * @param {string} markdown
 * @returns {string}
 */
export function stripLeadingMarkdownTitle(markdown) {
  return `${markdown ?? ""}`.replace(LEADING_MARKDOWN_TITLE_PATTERN, "").replace(/^\n+/, "");
}
