import profileImage from "../assets/profile.jpeg";
import { SITE, SOCIAL_CONTACT_IDS } from "../config/site.ts";
import { serializeJsonForHtmlScript } from "./script-safe.ts";
import { absoluteUrl } from "./seo-meta.ts";
import { POSTS_INDEX_PATH } from "./site-paths.ts";

const PERSON_ID = absoluteUrl("/#person");
const WEBSITE_ID = absoluteUrl("/#website");
const BLOG_ID = absoluteUrl("/#blog");
const BLOG_URL = absoluteUrl(POSTS_INDEX_PATH);
const IN_LANGUAGE = "fr-FR";

export * from "./seo-meta.ts";

type BlogPostingInput = {
  canonicalUrl: string;
  category?: string;
  datePublished: Date;
  dateModified?: Date;
  description: string;
  image?: string;
  tags?: string[];
  title: string;
};

function resolvePersonSameAs() {
  return SITE.contacts
    .filter((contact) => SOCIAL_CONTACT_IDS.includes(contact.id))
    .map((contact) => contact.href);
}

function buildPersonEntity() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE.author.name,
    alternateName: SITE.author.alias,
    email: SITE.author.email,
    image: absoluteUrl(profileImage.src),
    url: absoluteUrl(SITE.aboutPath),
    jobTitle: SITE.author.jobTitle,
    description: SITE.author.description,
    knowsAbout: SITE.author.knowsAbout,
    sameAs: resolvePersonSameAs()
  };
}

export function buildWebsiteSchema() {
  return serializeJsonForHtmlScript({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE.title,
    alternateName: SITE.alternateName,
    url: SITE.siteUrl,
    description: SITE.description,
    inLanguage: IN_LANGUAGE,
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
    inLanguage: IN_LANGUAGE,
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
  const copyrightYear = new Date().getFullYear();

  return serializeJsonForHtmlScript({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonicalUrl}#article`,
    headline: title,
    description,
    datePublished: datePublished.toISOString(),
    dateModified: (dateModified ?? datePublished).toISOString(),
    inLanguage: IN_LANGUAGE,
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
    ...(category ? { articleSection: category } : {}),
    ...(image ? { image: absoluteUrl(image) } : {}),
    ...(tags?.length ? { keywords: tags.join(", ") } : {}),
    license: SITE.license.url,
    copyrightHolder: { "@id": PERSON_ID },
    copyrightYear,
    author: buildPersonEntity(),
    publisher: buildPersonEntity(),
    isPartOf: {
      "@type": "Blog",
      "@id": BLOG_ID,
      name: SITE.blogTitle,
      url: BLOG_URL,
      inLanguage: IN_LANGUAGE,
      publisher: { "@id": PERSON_ID }
    }
  });
}
