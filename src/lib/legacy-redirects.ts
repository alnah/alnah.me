type LegacyRedirect = {
  from: string;
  to: string;
};

/**
 * Legacy routes that must keep resolving after the Astro migration. Splats
 * revive whole sections without shadowing the current taxonomy routes, so the
 * fixed `/categories/*` paths stay untouched.
 */
const LEGACY_REDIRECTS: LegacyRedirect[] = [
  { from: "/about", to: "/a-propos/" },
  { from: "/about/", to: "/a-propos/" },
  { from: "/privacy/", to: "/confidentialite/" },
  { from: "/LICENSE", to: "/LICENSE.txt" },
  { from: "/posts", to: "/articles/" },
  { from: "/posts/", to: "/articles/" },
  { from: "/posts/*", to: "/articles/" },
  { from: "/post/*", to: "/articles/" },
  { from: "/tags/", to: "/articles/" },
  { from: "/tags/*", to: "/articles/" },
  { from: "/index.xml", to: "/rss.xml" },
  { from: "/sitemap.xml", to: "/sitemap-index.xml" },
  { from: "/categories/best-practices/", to: "/categories/" },
  { from: "/categories/deep-dives/", to: "/categories/" },
  { from: "/categories/opinions/", to: "/categories/" },
  { from: "/categories/project-updates/", to: "/categories/" },
  { from: "/categories/tutorials/", to: "/categories/" },
  { from: "/categories/outils", to: "/categories/outiller/" },
  { from: "/categories/outils/", to: "/categories/outiller/" },
  { from: "/etiquettes/p-dagogie", to: "/etiquettes/pedagogie/" },
  { from: "/etiquettes/p-dagogie/", to: "/etiquettes/pedagogie/" }
];

/**
 * A retired category alias must not chain into an archive that does not exist
 * yet. While the category is empty, it lands on the category index instead.
 */
export function buildLegacyRedirectLines(publishedCategories: readonly string[] = []) {
  const populated = new Set(publishedCategories);

  return LEGACY_REDIRECTS.map(({ from, to }) => {
    const category = to.match(/^\/categories\/([^/]+)\/$/)?.[1];
    const target = category && !populated.has(category) ? "/categories/" : to;

    return `${from} ${target} 301`;
  });
}
