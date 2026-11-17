import path from "node:path";
import { SITE } from "../src/config/site.ts";
import { resolvePostDate, slugify } from "../src/lib/content/format.ts";
import {
  POST_CATEGORIES,
  summarizeTags,
  type PostCategory
} from "../src/lib/content/taxonomy.ts";
import { isPublishedData, latestOf, resolvePublicationDate } from "../src/lib/publication.ts";
import {
  getMarkdownEntries,
  type MarkdownPostEntry
} from "../src/lib/post-files.ts";
import { buildEmptyCategoryPaths } from "../src/lib/sitemap.ts";
import {
  articlesPagePath,
  categoryPath,
  CATEGORIES_INDEX_PATH,
  pageSocialImagePath,
  POSTS_INDEX_PATH,
  postPath,
  postSocialImagePath,
  rawPostPath,
  tagPath
} from "../src/lib/site-paths.ts";

/**
 * Single source of build expectations. Tests derive what the site must
 * contain from the Markdown frontmatter, the taxonomy, and the site config,
 * instead of naming posts, dates, or categories.
 */
export type ExpectedPost = {
  slug: string;
  title: string;
  description: string;
  category: PostCategory;
  tags: string[];
  tagSlugs: string[];
  date: Date;
  publicationDate: Date;
  /** Latest of date and lastmod, as advertised in the sitemap. */
  lastmod: Date;
  /** True when lastmod is strictly later than the publication date. */
  isUpdated: boolean;
  /** Date rendered on the page and in listings. */
  displayDate: Date;
  url: string;
  rawPath: string;
  socialImagePath: string;
};

const contentRoot = path.join(process.cwd(), "src/content/posts");

function expectedPost(entry: MarkdownPostEntry): ExpectedPost {
  const { title, description, category, date } = entry.postData;
  const publicationDate = resolvePublicationDate(entry.postData);
  const display = resolvePostDate(publicationDate, entry.postData.lastmod);
  const lastmod = latestOf([publicationDate, entry.postData.lastmod]) ?? publicationDate;

  return {
    slug: entry.slug,
    title,
    description,
    category,
    tags: entry.tags,
    tagSlugs: [...new Set(entry.tags.map(slugify))],
    date,
    publicationDate,
    lastmod,
    isUpdated: display.isUpdated,
    displayDate: display.date,
    url: postPath(entry.slug),
    rawPath: rawPostPath(entry.slug),
    socialImagePath: postSocialImagePath(entry.slug)
  };
}

const entries = await getMarkdownEntries(contentRoot);
const publishedEntries = entries.filter((entry) => isPublishedData(entry.postData));

export const PUBLISHED_POSTS: ExpectedPost[] = publishedEntries
  .map(expectedPost)
  .sort((left, right) => right.publicationDate.getTime() - left.publicationDate.getTime());

/** Posts that must produce no page, no export, no image, and no sitemap entry. */
export const UNPUBLISHED_POST_SLUGS = entries
  .filter((entry) => !publishedEntries.includes(entry))
  .map((entry) => entry.slug);

export const EMPTY_CATEGORY_PATHS = buildEmptyCategoryPaths(
  PUBLISHED_POSTS.map((post) => ({ category: post.category }))
);

export const PUBLISHED_CATEGORIES: PostCategory[] = POST_CATEGORIES.filter(
  (category) => !EMPTY_CATEGORY_PATHS.has(categoryPath(category))
);

const PUBLISHED_TAGS = summarizeTags(PUBLISHED_POSTS.map((post) => post.tags));

export type ExpectedSocialImage = {
  pagePath: string;
  imagePath: string;
};

/** Every indexable page owns one generated card under /og. */
export const EXPECTED_SOCIAL_IMAGES: ExpectedSocialImage[] = [
  "/",
  "/a-propos/",
  "/confidentialite/",
  POSTS_INDEX_PATH,
  CATEGORIES_INDEX_PATH,
  ...PUBLISHED_CATEGORIES.map((category) => categoryPath(category)),
  ...PUBLISHED_TAGS.map((tag) => tagPath(tag.slug)),
  ...PUBLISHED_POSTS.map((post) => post.url)
].map((pagePath) => ({
  pagePath,
  imagePath: pageSocialImagePath(pagePath)
}));

/** Pages that are route files rather than content entries. */
const STATIC_PAGE_PATHS = [
  "/",
  "/a-propos/",
  "/confidentialite/",
  POSTS_INDEX_PATH,
  CATEGORIES_INDEX_PATH
];

const SITE_URL = SITE.siteUrl;

export function absoluteUrl(pathname: string) {
  return new URL(pathname, SITE_URL).toString();
}

export function expectedSitemapPaths(pageSize = SITE.postPageSize) {
  const paths = new Set<string>(STATIC_PAGE_PATHS);

  for (const post of PUBLISHED_POSTS) {
    paths.add(post.url);
  }

  for (const category of PUBLISHED_CATEGORIES) {
    paths.add(categoryPath(category));
  }

  for (const tag of PUBLISHED_TAGS) {
    paths.add(tagPath(tag.slug));
  }

  const pageCount = Math.ceil(PUBLISHED_POSTS.length / pageSize);

  for (let page = 2; page <= pageCount; page += 1) {
    paths.add(articlesPagePath(page));
  }

  return paths;
}
