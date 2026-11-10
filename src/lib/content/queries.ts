import { getCollection, type CollectionEntry } from "astro:content";
import { isPublishedData, resolvePublicationDate } from "../publication";
import { slugify } from "./format";
import {
  getPostCategoryMeta,
  isPostCategory,
  POST_CATEGORIES,
  summarizeTags,
  type PostCategory
} from "./taxonomy";

export type PostEntry = CollectionEntry<"posts">;

export function isPublished(post: PostEntry) {
  return isPublishedData(post.data);
}

export function sortPosts(posts: PostEntry[]) {
  return [...posts].sort((left, right) => {
    const leftDate = resolvePublicationDate(left.data).getTime();
    const rightDate = resolvePublicationDate(right.data).getTime();
    return rightDate - leftDate;
  });
}

export async function getPublishedPosts() {
  const posts = await getCollection("posts", isPublished);
  return sortPosts(posts);
}

export async function getPageContent(slug: string) {
  const pages = await getCollection("pages");
  return pages.find((page) => page.id === slug);
}

export async function getPostsByTag(tagSlug: string) {
  const posts = await getPublishedPosts();
  return posts.filter((post) =>
    post.data.tags.some((tag) => slugify(tag) === tagSlug)
  );
}

export async function getPostsByCategory(categorySlug: string) {
  if (!isPostCategory(categorySlug)) {
    return [];
  }

  const posts = await getPublishedPosts();
  return posts.filter((post) => post.data.category === categorySlug);
}

export async function getTags() {
  const posts = await getPublishedPosts();
  return summarizeTags(posts.map((post) => post.data.tags));
}

/**
 * The taxonomy is fixed; empty categories are still returned so their URLs
 * stay stable and the index stays complete.
 */
export async function getCategories() {
  const posts = await getPublishedPosts();
  const counts = new Map<PostCategory, number>();

  for (const post of posts) {
    counts.set(post.data.category, (counts.get(post.data.category) ?? 0) + 1);
  }

  return POST_CATEGORIES.map((category) => ({
    ...getPostCategoryMeta(category),
    count: counts.get(category) ?? 0
  }));
}
