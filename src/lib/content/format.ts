import { latestOf } from "../publication.ts";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export type PostDate = {
  date: Date;
  label: string;
  isUpdated: boolean;
};

/**
 * Resolve the displayed date. An update only replaces the publication date
 * when lastmod is strictly later. Equal or earlier values are ignored.
 */
export function resolvePostDate(
  publicationDate: Date,
  lastmod?: Date
): PostDate {
  const date = latestOf([publicationDate, lastmod]) ?? publicationDate;
  const isUpdated = date.getTime() > publicationDate.getTime();

  return {
    date,
    label: isUpdated ? `Mis à jour le ${formatDate(date)}` : formatDate(date),
    isUpdated
  };
}

export function formatIsoDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readingTimeFromText(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Reading time from visible text only: fences and code are not prose. */
export function readingTimeFromMarkdown(markdown: string) {
  return readingTimeFromText(markdownToPlainText(markdown));
}

export function excerptFromMarkdown(markdown: string, maxLength = 180) {
  const plainText = markdownToPlainText(markdown);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trim()}...`;
}
