import {
  excerptFromMarkdown,
  formatDate,
  formatIsoDate,
  markdownToPlainText
} from "./content/format.ts";
import { derivePostMeta } from "./content/post-meta.ts";
import type { PostEntry } from "./content/queries.ts";
import { getPostCategoryMeta } from "./content/taxonomy.ts";
import { stripLeadingMarkdownTitle } from "./document-title.ts";
import { postPath } from "./site-paths.ts";
import {
  buildSearchFieldIndex,
  type SearchDocument,
  type SearchIndexDocument
} from "./search-ranking.ts";

export type {
  RankedSearchDocument,
  SearchDocument,
  SearchFieldIndex,
  SearchIndexDocument
} from "./search-ranking.ts";
export { searchDocuments } from "./search-ranking.ts";

/**
 * Every date spelling a reader may type: ISO, French labels, parts, padded
 * parts, so "mars 2026" or "01/03/2026" both match the date field.
 */
function searchDateText(date: Date) {
  const year = String(date.getUTCFullYear());
  const monthNumber = String(date.getUTCMonth() + 1);
  const paddedMonth = monthNumber.padStart(2, "0");
  const dayNumber = String(date.getUTCDate());
  const paddedDay = dayNumber.padStart(2, "0");
  const shortMonth = new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    timeZone: 'UTC'
  }).format(date);
  const longMonth = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    timeZone: 'UTC'
  }).format(date);

  return [
    formatIsoDate(date),
    formatDate(date),
    year,
    `${year}-${paddedMonth}`,
    `${year}-${paddedMonth}-${paddedDay}`,
    monthNumber,
    paddedMonth,
    dayNumber,
    paddedDay,
    shortMonth,
    longMonth,
    `${shortMonth} ${year}`,
    `${longMonth} ${year}`,
    `${shortMonth} ${dayNumber}`,
    `${longMonth} ${dayNumber}`,
    `${shortMonth} ${dayNumber}, ${year}`,
    `${longMonth} ${dayNumber}, ${year}`,
    `${paddedMonth}/${paddedDay}/${year}`,
    `${paddedDay}/${paddedMonth}/${year}`
  ]
    .filter(Boolean)
    .join(" ");
}

export function createSearchDocument(post: PostEntry): SearchDocument {
  const contentBody = stripLeadingMarkdownTitle(post.body ?? "");
  const content = markdownToPlainText(contentBody);
  const meta = derivePostMeta(post);

  return {
    title: meta.title,
    description: post.data.description,
    category: getPostCategoryMeta(post.data.category).label,
    tags: post.data.tags,
    url: postPath(post.id),
    date: meta.publicationIso,
    dateLabel: formatDate(meta.publicationDate),
    updated: meta.postDate.isUpdated ? meta.displayIso : undefined,
    updatedLabel: meta.postDate.isUpdated ? meta.postDate.label : undefined,
    excerpt: excerptFromMarkdown(contentBody),
    content
  };
}

function expandDateText(iso: string | undefined, label: string | undefined) {
  if (!iso) {
    return label ?? "";
  }

  const parsedDate = new Date(`${iso}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return `${iso} ${label ?? ""}`.trim();
  }

  return `${iso} ${label ?? ""} ${searchDateText(parsedDate)}`.trim();
}

function buildExpandedDateSearchText(
  item: Pick<SearchDocument, "date" | "dateLabel" | "updated" | "updatedLabel">
) {
  return [
    expandDateText(item.date, item.dateLabel),
    expandDateText(item.updated, item.updatedLabel)
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function buildSearchIndex(items: SearchDocument[]): SearchIndexDocument[] {
  return items.map((item, position) => ({
    ...item,
    position,
    search: {
      title: buildSearchFieldIndex(item.title),
      category: buildSearchFieldIndex(item.category),
      tags: buildSearchFieldIndex((item.tags ?? []).join(" ")),
      date: buildSearchFieldIndex(buildExpandedDateSearchText(item)),
      description: buildSearchFieldIndex(item.description),
      excerpt: buildSearchFieldIndex(item.excerpt),
      content: buildSearchFieldIndex(item.content)
    }
  }));
}
