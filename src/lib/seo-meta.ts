import { SITE } from "../config/site.ts";

export interface SeoInput {
  canonicalPath: string;
  description: string;
  image?: string;
  title?: string;
  type?: "article" | "website";
}

export function pageTitle(title?: string) {
  const suffix = ` - ${SITE.title}`;

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
    return absoluteUrl(`/articles/${slug}/${image.replace(/^\.?\//, "")}`);
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
  const isDefaultSocialImage = resolvedImage === absoluteUrl(SITE.defaultSocialImage);

  return {
    canonicalUrl,
    description,
    image: resolvedImage,
    imageHeight: isDefaultSocialImage ? 630 : undefined,
    imageWidth: isDefaultSocialImage ? 1200 : undefined,
    title: pageTitle(title),
    twitterCard: resolvedImage ? "summary_large_image" : "summary",
    type
  };
}
