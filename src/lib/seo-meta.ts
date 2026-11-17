import { SITE } from "../config/site.ts";
import { postPath } from "./site-paths.ts";

export type SeoInput = {
  canonicalPath: string;
  description: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  title?: string;
  type?: "article" | "website";
};

export function pageTitle(title?: string) {
  const suffix = ` - ${SITE.author.name}`;
  const base = title?.trim();

  if (!base || base === SITE.author.name) {
    return `${SITE.title}${suffix}`;
  }

  return base.endsWith(suffix) ? base : `${base}${suffix}`;
}

export function absoluteUrl(pathname: string) {
  return new URL(pathname, SITE.siteUrl).toString();
}

/** Generated cards under /og/ share the 1200x630 contract. */
export function isGeneratedSocialImage(image: string | undefined) {
  return image?.startsWith("/og/") ?? false;
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
    return absoluteUrl(`${postPath(slug)}${image.replace(/^\.?\//, "")}`);
  }

  return absoluteUrl(`/${image.replace(/^\.?\//, "")}`);
}

export function buildSeo({
  canonicalPath,
  description,
  image,
  imageWidth,
  imageHeight,
  title,
  type = "website"
}: SeoInput) {
  const canonicalUrl = absoluteUrl(canonicalPath);
  const resolvedImage = resolveSocialImage(image ?? SITE.defaultSocialImage);
  const isDefaultSocialImage = resolvedImage === absoluteUrl(SITE.defaultSocialImage);
  const hasFixedSize =
    isDefaultSocialImage || isGeneratedSocialImage(image);

  return {
    canonicalUrl,
    description,
    image: resolvedImage,
    imageHeight: imageHeight ?? (hasFixedSize ? 630 : undefined),
    imageWidth: imageWidth ?? (hasFixedSize ? 1200 : undefined),
    title: pageTitle(title),
    twitterCard: resolvedImage ? "summary_large_image" : "summary",
    type
  };
}
