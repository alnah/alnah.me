const LEADING_MARKDOWN_TITLE_PATTERN = /^(?:\uFEFF)?\s*#\s+(.+?)\s*#*\s*(?:\r?\n|$)/;

function normalizeTitle(value) {
  return `${value ?? ""}`.replace(/\s+/g, " ").trim();
}

export function extractLeadingMarkdownTitle(markdown) {
  const match = `${markdown ?? ""}`.match(LEADING_MARKDOWN_TITLE_PATTERN);
  return match?.[1]?.trim() || null;
}

/**
 * We keep frontmatter and the leading H1 in lockstep so the rendered page, RSS,
 * search index, and raw reusable Markdown all describe the post the same way.
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

export function resolveMarkdownTitle(markdown, fallbackTitle) {
  return validateMarkdownTitle(markdown, fallbackTitle);
}

/**
 * Most callers already have the Astro content entry, so this helper keeps title
 * resolution consistent instead of repeating body/frontmatter wiring everywhere.
 */
export function resolveEntryTitle(entry) {
  return resolveMarkdownTitle(entry.body, entry.data.title);
}

/**
 * Reading time, search excerpts, and list previews should not repeat the visible
 * H1 because the layout already renders it once at the document boundary.
 */
export function stripLeadingMarkdownTitle(markdown) {
  return `${markdown ?? ""}`.replace(LEADING_MARKDOWN_TITLE_PATTERN, "").replace(/^\n+/, "");
}
