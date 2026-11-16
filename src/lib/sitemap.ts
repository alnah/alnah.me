import { POST_CATEGORIES } from "./content/taxonomy.ts";

/** Frontmatter fields the sitemap contract depends on. */
export type SitemapSourcePost = {
  category?: string;
};

/**
 * Sitemaps may only advertise indexable URLs. An empty category archive is a
 * noindex placeholder, so its path is returned here and filtered out of the
 * sitemap. Unknown categories are ignored: the content schema rejects them.
 */
export function buildEmptyCategoryPaths(posts: SitemapSourcePost[]) {
  const populatedCategories = new Set(
    posts
      .map((post) => post.category)
      .filter((category): category is string => Boolean(category))
  );

  return new Set(
    POST_CATEGORIES.filter((category) => !populatedCategories.has(category)).map(
      (category) => `/categories/${category}/`
    )
  );
}
