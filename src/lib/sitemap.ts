import { slugify } from "./content/format.ts";
import { POST_CATEGORIES } from "./content/taxonomy.ts";

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
    POST_CATEGORIES.filter((category) => !populatedCategories.has(category)).map(
      (category) => `/categories/${category}/`
    )
  );
}

/** Latest valid date, or undefined when no usable date was provided. */
function latestDate(dates: Array<Date | undefined>) {
  let latest: number | undefined;

  for (const date of dates) {
    const time = date?.getTime();

    if (time === undefined || Number.isNaN(time)) {
      continue;
    }

    if (latest === undefined || time > latest) {
      latest = time;
    }
  }

  return latest === undefined ? undefined : new Date(latest);
}

function keepLatest(byPath: Map<string, Date>, path: string, date?: Date) {
  if (!date) {
    return;
  }

  const current = byPath.get(path);

  if (!current || date.getTime() > current.getTime()) {
    byPath.set(path, date);
  }
}

export type SitemapMetadata = {
  emptyCategoryPaths: Set<string>;
  lastmodByPath: Map<string, string>;
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
    const lastmod = latestDate([post.date, post.lastmod]);

    if (!lastmod) {
      continue;
    }

    postLastmods.push(lastmod);
    lastmodByPath.set(`/articles/${post.slug}/`, lastmod);

    if (post.category) {
      keepLatest(lastmodByPath, `/categories/${post.category}/`, lastmod);
    }

    for (const tag of post.tags ?? []) {
      keepLatest(lastmodByPath, `/etiquettes/${slugify(tag)}/`, lastmod);
    }
  }

  const newest = latestDate(postLastmods);

  if (newest) {
    lastmodByPath.set("/", newest);
    lastmodByPath.set("/articles/", newest);
    lastmodByPath.set("/categories/", newest);

    const pageCount = pageSize > 0 ? Math.ceil(posts.length / pageSize) : 1;

    for (let page = 2; page <= pageCount; page += 1) {
      lastmodByPath.set(`/articles/${page}/`, newest);
    }
  }

  return {
    emptyCategoryPaths: buildEmptyCategoryPaths(posts),
    lastmodByPath: new Map(
      [...lastmodByPath].map(([path, date]) => [path, date.toISOString()])
    )
  };
}
