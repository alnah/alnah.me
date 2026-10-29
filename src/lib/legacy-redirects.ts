export type LegacyRedirect = {
  from: string;
  to: string;
};

/**
 * Legacy Hugo routes that must keep resolving after the Astro migration.
 * Splats revive whole sections without shadowing the current taxonomy routes,
 * so the fixed `/categories/*` paths stay untouched.
 */
export const LEGACY_REDIRECTS: LegacyRedirect[] = [
  { from: "/about", to: "/a-propos/" },
  { from: "/about/", to: "/a-propos/" },
  { from: "/privacy/", to: "/confidentialite/" },
  { from: "/posts", to: "/articles/" },
  { from: "/posts/", to: "/articles/" },
  { from: "/posts/*", to: "/articles/" },
  { from: "/post/*", to: "/articles/" },
  { from: "/tags/", to: "/articles/" },
  { from: "/tags/*", to: "/articles/" },
  { from: "/index.xml", to: "/rss.xml" },
  { from: "/categories/best-practices/", to: "/categories/" },
  { from: "/categories/deep-dives/", to: "/categories/" },
  { from: "/categories/opinions/", to: "/categories/" },
  { from: "/categories/project-updates/", to: "/categories/" },
  { from: "/categories/tutorials/", to: "/categories/" }
];

export function buildLegacyRedirectLines() {
  return LEGACY_REDIRECTS.map(({ from, to }) => `${from} ${to} 301`);
}
