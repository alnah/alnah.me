import {
  excerptFromMarkdown,
  formatDate,
  formatIsoDate,
  markdownToPlainText,
  searchDateText
} from "./content/format";
import type { PostEntry } from "./content/queries";
import { getPostCategoryMeta } from "./content/taxonomy";
import { resolveEntryTitle, stripLeadingMarkdownTitle } from "./document-title.js";
import { resolvePublicationDate } from "./publication";
import {
  buildSearchFieldIndex,
  type SearchDocument,
  type SearchIndexDocument
} from "./search-ranking.js";

export type {
  RankedSearchDocument,
  SearchDocument,
  SearchFieldIndex,
  SearchIndexDocument
} from "./search-ranking.js";
export { searchDocuments } from "./search-ranking.js";

export function createSearchDocument(post: PostEntry): SearchDocument {
  const contentBody = stripLeadingMarkdownTitle(post.body ?? "");
  const content = markdownToPlainText(contentBody);
  const publicationDate = resolvePublicationDate(post.data);

  return {
    title: resolveEntryTitle(post),
    description: post.data.description,
    category: getPostCategoryMeta(post.data.category).label,
    tags: post.data.tags,
    url: `/articles/${post.id}/`,
    date: formatIsoDate(publicationDate),
    dateLabel: formatDate(publicationDate),
    excerpt: excerptFromMarkdown(contentBody),
    content
  };
}

function buildExpandedDateSearchText(item: Pick<SearchDocument, "date" | "dateLabel">) {
  if (!item.date) {
    return item.dateLabel ?? "";
  }

  const parsedDate = new Date(`${item.date}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return `${item.date} ${item.dateLabel ?? ""}`.trim();
  }

  return `${item.date} ${item.dateLabel ?? ""} ${searchDateText(parsedDate)}`.trim();
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
