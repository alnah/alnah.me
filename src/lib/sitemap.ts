import { slugify } from "./content/format.ts";
import { POST_CATEGORIES } from "./content/taxonomy.ts";
import { latestOf } from "./publication.ts";
import {
  articlesPagePath,
  categoryPath,
  CATEGORIES_INDEX_PATH,
  POSTS_INDEX_PATH,
  postPath,
  tagPath
} from "./site-paths.ts";

/** Frontmatter fields the sitemap contract depends on. */
export type SitemapCategorySource = {
  category?: string;
};

export type SitemapSourcePost = SitemapCategorySource & {
  slug: string;
  tags?: string[];
  date?: Date;
  lastmod?: Date;
};

/**
 * Sitemaps may only advertise indexable URLs. An empty category archive is a
 * noindex placeholder, so its path is returned here and filtered out of the
 * sitemap. Unknown categories are ignored: the content schema rejects them.
 */
export function buildEmptyCategoryPaths(posts: SitemapCategorySource[]) {
  const populatedCategories = new Set(
    posts
      .map((post) => post.category)
      .filter((category): category is string => Boolean(category))
  );

  return new Set(
    POST_CATEGORIES.filter((category) => !populatedCategories.has(category)).map(categoryPath)
  );
}

function keepLatest(byPath: Map<string, Date>, path: string, date?: Date) {
  const latest = latestOf([byPath.get(path), date]);

  if (latest) {
    byPath.set(path, latest);
  }
}

export type SitemapMetadata = {
  emptyCategoryPaths: Set<string>;
  lastmodByPath: Map<string, Date>;
};

/**
 * Build the per-URL sitemap metadata from published posts. `lastmod` is the
 * post's own `lastmod` when it is later than `date`, never the build time:
 * search engines ignore dates they cannot trust. Archive URLs inherit the
 * newest date of the posts they list.
 */
export function buildSitemapMetadata(
  posts: SitemapSourcePost[],
  { pageSize }: { pageSize: number }
): SitemapMetadata {
  const lastmodByPath = new Map<string, Date>();
  const postLastmods: Date[] = [];

  for (const post of posts) {
    const lastmod = latestOf([post.date, post.lastmod]);

    if (!lastmod) {
      continue;
    }

    postLastmods.push(lastmod);
    lastmodByPath.set(postPath(post.slug), lastmod);

    if (post.category) {
      keepLatest(lastmodByPath, categoryPath(post.category), lastmod);
    }

    for (const tag of post.tags ?? []) {
      keepLatest(lastmodByPath, tagPath(slugify(tag)), lastmod);
    }
  }

  const newest = latestOf(postLastmods);

  if (newest) {
    lastmodByPath.set("/", newest);
    lastmodByPath.set(POSTS_INDEX_PATH, newest);
    lastmodByPath.set(CATEGORIES_INDEX_PATH, newest);

    const pageCount = pageSize > 0 ? Math.ceil(posts.length / pageSize) : 1;

    for (let page = 2; page <= pageCount; page += 1) {
      lastmodByPath.set(articlesPagePath(page), newest);
    }
  }

  return {
    emptyCategoryPaths: buildEmptyCategoryPaths(posts),
    lastmodByPath
  };
}
