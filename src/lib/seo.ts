import profileImage from "../assets/profile.jpeg";
import { SITE, SOCIAL_CONTACT_IDS } from "../config/site.ts";
import { serializeJsonForHtmlScript } from "./script-safe.ts";
import { absoluteUrl } from "./seo-meta.ts";

export * from "./seo-meta.ts";

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

function resolvePersonSameAs() {
  return SITE.contacts
    .filter((contact) => SOCIAL_CONTACT_IDS.includes(contact.id))
    .map((contact) => contact.href);
}

function buildPersonEntity() {
  return {
    "@type": "Person",
    name: SITE.author.name,
    alternateName: SITE.author.alias,
    email: SITE.author.email,
    image: absoluteUrl(profileImage.src),
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
