export type DiagramAttribution = {
  title: string;
  /** Author name, with the alias when the page provides one. */
  author: string;
  siteName: string;
  siteUrl: string;
  pageUrl: string;
  /** ISO date (YYYY-MM-DD) when the page is an article, null otherwise. */
  date: string | null;
  licenseName: string;
  licenseUrl: string;
};

function metaContent(selector: string): string {
  return document.querySelector<HTMLMetaElement>(selector)?.content.trim() ?? "";
}

/**
 * Read attribution from the metadata rendered by BaseLayout: author, alias,
 * canonical URL, publication date, and license. The license follows the
 * repository notice, which asks for a credit, a link to the post, and a link
 * to CC BY 4.0.
 */
export function readAttribution(title: string | null): DiagramAttribution {
  const canonical =
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? location.href;
  const page = new URL(canonical, location.href);
  const name = metaContent('meta[name="author"]') || "Auteur";
  const alias = metaContent('meta[name="author:alias"]');
  const published = metaContent('meta[property="article:published_time"]');

  return {
    title: title?.trim() || "Diagramme",
    author: alias ? `${name} (${alias})` : name,
    siteName: page.hostname,
    siteUrl: page.origin,
    pageUrl: page.toString(),
    date: published ? published.slice(0, 10) : null,
    licenseName: metaContent('meta[name="license"]') || "CC BY 4.0",
    licenseUrl:
      document.querySelector<HTMLLinkElement>('link[rel="license"]')?.href ??
      "https://creativecommons.org/licenses/by/4.0/"
  };
}
