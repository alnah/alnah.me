import { SITE } from "../config/site";

export function GET() {
  const sitemapUrl = new URL("/sitemap-index.xml", SITE.siteUrl).toString();

  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /index.json",
      "Disallow: /raw/posts/",
      `Sitemap: ${sitemapUrl}`,
      ""
    ].join("\n"),
    {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
    }
  );
}
