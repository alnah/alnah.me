import {
  excerptFromMarkdown,
  formatDate,
  formatIsoDate,
  markdownToPlainText,
  resolvePostDate,
  searchDateText
} from "./content/format.ts";
import type { PostEntry } from "./content/queries.ts";
import { getPostCategoryMeta } from "./content/taxonomy.ts";
import { resolveEntryTitle, stripLeadingMarkdownTitle } from "./document-title.ts";
import { resolvePublicationDate } from "./publication.ts";
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

export function createSearchDocument(post: PostEntry): SearchDocument {
  const contentBody = stripLeadingMarkdownTitle(post.body ?? "");
  const content = markdownToPlainText(contentBody);
  const publicationDate = resolvePublicationDate(post.data);
  const postDate = resolvePostDate(publicationDate, post.data.lastmod);

  return {
    title: resolveEntryTitle(post),
    description: post.data.description,
    category: getPostCategoryMeta(post.data.category).label,
    tags: post.data.tags,
    url: postPath(post.id),
    date: formatIsoDate(publicationDate),
    dateLabel: formatDate(publicationDate),
    updated: postDate.isUpdated ? formatIsoDate(postDate.date) : undefined,
    updatedLabel: postDate.isUpdated ? postDate.label : undefined,
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
