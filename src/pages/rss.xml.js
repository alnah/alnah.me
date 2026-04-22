import rss from "@astrojs/rss";
import { SITE } from "../config/site";
import { getPostCategoryMeta, getPublishedPosts } from "../lib/content";
import { resolveEntryTitle } from "../lib/document-title.js";

export async function GET(context) {
  const posts = await getPublishedPosts();
  const latestBuildDate = posts[0]?.data.lastmod ?? posts[0]?.data.date ?? new Date();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom"
    },
    customData: `
      <language>fr</language>
      <lastBuildDate>${latestBuildDate.toUTCString()}</lastBuildDate>
      <generator>Astro v6 with @astrojs/rss</generator>
      <atom:link href="${new URL("/rss.xml", context.site).toString()}" rel="self" type="application/rss+xml" />
    `,
    items: posts.map((post) => ({
      title: resolveEntryTitle(post),
      description: post.data.description,
      pubDate: post.data.date,
      link: `/articles/${post.id}/`,
      categories: [getPostCategoryMeta(post.data.category).label, ...post.data.tags],
      author: SITE.author.email
    }))
  });
}
