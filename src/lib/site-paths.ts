/**
 * Canonical URL paths for generated routes. Every surface that links to or
 * asserts a route derives it here, so pages, feeds, search, sitemap, and
 * redirect artifacts cannot drift apart.
 */

export const POSTS_INDEX_PATH = "/articles/";
export const CATEGORIES_INDEX_PATH = "/categories/";

export function postPath(slug: string): string {
  return `/articles/${slug}/`;
}

/** Inverse of postPath: the slug inside an article path, or null. */
export function postSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/articles\/([^/]+)\/$/);
  return match ? match[1] : null;
}

export function rawPostPath(slug: string): string {
  return `/raw/posts/${slug}.md`;
}

export function postSocialImagePath(slug: string): string {
  return `/og/articles/${slug}.png`;
}

export function categoryPath(category: string): string {
  return `/categories/${category}/`;
}

export function tagPath(tagSlug: string): string {
  return `/etiquettes/${tagSlug}/`;
}

/** Page 1 is the archive index; later pages carry their number. */
export function articlesPagePath(page: number): string {
  return page <= 1 ? POSTS_INDEX_PATH : `${POSTS_INDEX_PATH}${page}/`;
}
