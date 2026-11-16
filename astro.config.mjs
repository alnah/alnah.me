import path from "node:path";
import { defineConfig, passthroughImageService } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import {
  dedupeRedirects,
  isSplatRedirect,
  legacyRedirectTargets
} from "./src/lib/legacy-redirects.ts";
import { markdownHastPlugins } from "./src/lib/markdown/plugins.ts";
import {
  buildAliasRedirects,
  buildRawAliasRedirects,
  getPublishedMarkdownEntries
} from "./src/lib/post-files.ts";
import { buildSitemapMetadata } from "./src/lib/sitemap.ts";
import { SITE } from "./src/config/site.ts";

// The sitemap contract is checked at config load: only published Markdown
// decides which category archives exist and when each URL last changed.
const publishedPosts = await getPublishedMarkdownEntries(
  path.join(process.cwd(), "src/content/posts")
);
const sitemapMetadata = buildSitemapMetadata(
  publishedPosts.map(({ slug, category, tags, postData }) => ({
    slug,
    category,
    tags,
    date: postData.date,
    lastmod: postData.lastmod
  })),
  { pageSize: SITE.postPageSize }
);

// Same 301s as public/_redirects, replayed by dev and preview: concrete
// sources only, splat rules stay file-based. Cloudflare keeps `_redirects` as
// the edge authority; these pages are the static fallback.
const aliasRedirects = buildAliasRedirects(publishedPosts);
const redirects = Object.fromEntries(
  dedupeRedirects([
    ...aliasRedirects,
    ...buildRawAliasRedirects(aliasRedirects),
    ...legacyRedirectTargets(publishedPosts.map(({ category }) => category)).filter(
      ([from]) => !isSplatRedirect(from)
    )
  ])
);

export default defineConfig({
  site: "https://alnah.me",
  output: "static",
  cacheDir: "./.astro/cache",
  redirects,
  integrations: [
    sitemap({
      // Empty category archives are noindex placeholders; the sitemap only
      // lists URLs that are 200, canonical, and indexable.
      filter: (page) => !sitemapMetadata.emptyCategoryPaths.has(new URL(page).pathname),
      // Dates come from the content, never from the build.
      serialize: (item) => {
        const lastmod = sitemapMetadata.lastmodByPath.get(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod: lastmod.toISOString() } : item;
      }
    })
  ],
  image: {
    service: passthroughImageService()
  },
  vite: {
    build: {
      // Mermaid emits large lazy chunks (ELK layout, shared renderer) above Vite's default 500 kB limit.
      chunkSizeWarningLimit: 1600
    }
  },
  markdown: {
    processor: satteri({ hastPlugins: markdownHastPlugins() }),
    syntaxHighlight: {
      type: "shiki",
      excludeLangs: ["math", "mermaid"]
    },
    shikiConfig: {
      theme: "github-dark-default",
      themes: {
        light: "github-light-default",
        dark: "github-dark-default"
      },
      wrap: true
    }
  }
});
