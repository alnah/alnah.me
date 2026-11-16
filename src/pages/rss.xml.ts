import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { version as astroVersion } from "astro/package.json";
import { SITE } from "../config/site.ts";
import { getPostCategoryMeta, getPublishedPosts, resolvePostDate, resolvePublicationDate } from "../lib/content/index.ts";
import { resolveEntryTitle } from "../lib/document-title.ts";
import { latestOf } from "../lib/publication.ts";
import { postPath } from "../lib/site-paths.ts";

export async function GET(context: APIContext) {
  const site = context.site ?? new URL(SITE.siteUrl);
  const posts = await getPublishedPosts();
  const latestBuildDate =
    latestOf(
      posts.map((post) =>
        resolvePostDate(resolvePublicationDate(post.data), post.data.lastmod).date
      )
    ) ?? new Date();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom"
    },
    customData: `
      <language>fr</language>
      <lastBuildDate>${latestBuildDate.toUTCString()}</lastBuildDate>
      <generator>Astro v${astroVersion} with @astrojs/rss</generator>
      <atom:link href="${new URL("/rss.xml", site).toString()}" rel="self" type="application/rss+xml" />
    `,
    items: posts.map((post) => ({
      title: resolveEntryTitle(post),
      description: post.data.description,
      pubDate: resolvePublicationDate(post.data),
      link: postPath(post.id),
      categories: [getPostCategoryMeta(post.data.category).label, ...post.data.tags],
      author: SITE.author.email
    }))
  });
}
