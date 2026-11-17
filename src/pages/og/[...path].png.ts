import type { APIRoute } from "astro";
import { SITE } from "../../config/site.ts";
import {
  ARTICLES_PAGE_META,
  CATEGORIES_PAGE_META,
  categoryArchiveMeta,
  derivePostMeta,
  getCategories,
  getPageContent,
  getPublishedPosts,
  getTags,
  tagArchiveMeta,
  type PageMetadata
} from "../../lib/content/index.ts";
import { resolveEntryTitle } from "../../lib/document-title.ts";
import { renderSocialImage } from "../../lib/social-image.ts";
import {
  CATEGORIES_INDEX_PATH,
  categoryPath,
  pageSocialImageName,
  POSTS_INDEX_PATH,
  postPath,
  tagPath
} from "../../lib/site-paths.ts";

type SocialImagePage = PageMetadata & {
  path: string;
};

async function contentPageMetadata(
  slug: string,
  label: string
): Promise<PageMetadata> {
  const page = await getPageContent(slug);

  if (!page) {
    throw new Error(`Missing ${label} page content`);
  }

  return {
    title: resolveEntryTitle(page),
    description: page.data.description ?? SITE.description
  };
}

/** Every indexable page owns one generated card under /og/. */
async function listSocialImagePages(): Promise<SocialImagePage[]> {
  const [posts, categories, tags, about, privacy] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
    getTags(),
    contentPageMetadata("a-propos", "about"),
    contentPageMetadata("confidentialite", "privacy")
  ]);

  return [
    {
      path: "/",
      title: SITE.title,
      description: SITE.description
    },
    {
      path: SITE.aboutPath,
      ...about
    },
    {
      path: "/confidentialite/",
      ...privacy
    },
    {
      path: POSTS_INDEX_PATH,
      ...ARTICLES_PAGE_META
    },
    {
      path: CATEGORIES_INDEX_PATH,
      ...CATEGORIES_PAGE_META
    },
    ...categories
      .filter((category) => category.count > 0)
      .map((category) => ({
        path: categoryPath(category.slug),
        ...categoryArchiveMeta(category)
      })),
    ...tags.map((tag) => ({
      path: tagPath(tag.slug),
      ...tagArchiveMeta(tag)
    })),
    ...posts.map((post) => ({
      path: postPath(post.id),
      title: derivePostMeta(post).title,
      description: post.data.description
    }))
  ];
}

export async function getStaticPaths() {
  const pages = await listSocialImagePages();

  return pages.map(({ path, title, description }) => ({
    params: { path: pageSocialImageName(path) },
    props: { title, description }
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { title, description } = props as PageMetadata;
  const png = await renderSocialImage({
    title,
    description,
    authorName: SITE.author.name
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png"
    }
  });
};
