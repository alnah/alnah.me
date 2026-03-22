import { SITE } from "../config/site";
import { serializeJsonForHtmlScript } from "./script-safe.js";

interface SeoInput {
  canonicalPath: string;
  description: string;
  image?: string;
  title?: string;
  type?: "article" | "website";
}

interface BlogPostingInput {
  canonicalUrl: string;
  category?: string;
  datePublished: Date;
  dateModified?: Date;
  description: string;
  image?: string;
  tags?: string[];
  title: string;
}

export function pageTitle(title?: string) {
  const suffix = ` · ${SITE.title}`;

  if (!title || title === SITE.title) {
    return SITE.title;
  }

  return title.endsWith(suffix) ? title : `${title}${suffix}`;
}

export function absoluteUrl(pathname: string) {
  return new URL(pathname, SITE.siteUrl).toString();
}

export function resolveSocialImage(image: string | undefined, slug?: string) {
  if (!image) {
    return undefined;
  }

  if (/^https?:\/\//.test(image)) {
    return image;
  }

  if (image.startsWith("/")) {
    return absoluteUrl(image);
  }

  if (slug) {
    return absoluteUrl(`/posts/${slug}/${image.replace(/^\.?\//, "")}`);
  }

  return absoluteUrl(`/${image.replace(/^\.?\//, "")}`);
}

export function buildSeo({
  canonicalPath,
  description,
  image,
  title,
  type = "website"
}: SeoInput) {
  const canonicalUrl = absoluteUrl(canonicalPath);
  const resolvedImage = resolveSocialImage(image ?? SITE.defaultSocialImage);

  return {
    canonicalUrl,
    description,
    image: resolvedImage,
    title: pageTitle(title),
    twitterCard: resolvedImage ? "summary_large_image" : "summary",
    type
  };
}

function resolvePersonSameAs() {
  return SITE.contacts
    .filter((contact) =>
      ["github", "x", "bluesky", "mastodon", "linkedin"].includes(contact.id)
    )
    .map((contact) => contact.href);
}

function buildPersonEntity() {
  return {
    "@type": "Person",
    name: SITE.author.name,
    alternateName: SITE.author.alias,
    email: SITE.author.email,
    image: absoluteUrl(SITE.author.image),
    url: absoluteUrl(SITE.aboutPath),
    sameAs: resolvePersonSameAs()
  };
}

export function buildWebsiteSchema() {
  return serializeJsonForHtmlScript({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.title,
    alternateName: SITE.alternateName,
    url: SITE.siteUrl,
    description: SITE.description,
    publisher: buildPersonEntity()
  });
}

export function buildProfilePageSchema({
  canonicalUrl,
  description,
  title
}: {
  canonicalUrl: string;
  description: string;
  title: string;
}) {
  return serializeJsonForHtmlScript({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: title,
    url: canonicalUrl,
    description,
    mainEntity: buildPersonEntity()
  });
}

export function buildBlogPostingSchema({
  canonicalUrl,
  category,
  dateModified,
  datePublished,
  description,
  image,
  tags,
  title
}: BlogPostingInput) {
  return serializeJsonForHtmlScript({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    datePublished: datePublished.toISOString(),
    dateModified: (dateModified ?? datePublished).toISOString(),
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
    ...(category ? { articleSection: category } : {}),
    ...(image ? { image } : {}),
    ...(tags?.length ? { keywords: tags.join(", ") } : {}),
    author: buildPersonEntity(),
    publisher: buildPersonEntity()
  });
}
