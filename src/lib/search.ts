import type { CollectionEntry } from "astro:content";
import {
  excerptFromMarkdown,
  formatDate,
  formatIsoDate,
  markdownToPlainText,
  searchDateText
} from "./content/format";
import { resolveEntryTitle, stripLeadingMarkdownTitle } from "./document-title.js";

type PostEntry = CollectionEntry<"posts">;

export type SearchDocument = {
  title: string;
  description: string;
  tags: string[];
  url: string;
  date: string;
  dateLabel: string;
  excerpt: string;
  content: string;
};

export type SearchFieldIndex = {
  normalized: string;
  tokens: string[];
};

export type SearchIndexDocument = SearchDocument & {
  position: number;
  search: {
    title: SearchFieldIndex;
    tags: SearchFieldIndex;
    date: SearchFieldIndex;
    description: SearchFieldIndex;
    excerpt: SearchFieldIndex;
    content: SearchFieldIndex;
  };
};

/**
 * Readers usually remember a post by title, tag, or a rough date before they
 * remember exact prose, so the ranking deliberately favors editorial metadata.
 */
export const SEARCH_WEIGHTS = {
  title: 24,
  tags: 18,
  date: 14,
  description: 8,
  excerpt: 5,
  content: 2
} as const;

export function createSearchDocument(post: PostEntry): SearchDocument {
  const contentBody = stripLeadingMarkdownTitle(post.body ?? "");
  const content = markdownToPlainText(contentBody);

  return {
    title: resolveEntryTitle(post),
    description: post.data.description,
    tags: post.data.tags,
    url: `/posts/${post.id}/`,
    date: formatIsoDate(post.data.date),
    dateLabel: formatDate(post.data.date),
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

export function normalizeSearchValue(value: string | null | undefined) {
  return `${value ?? ""}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitSearchTokens(value: string) {
  const normalized = normalizeSearchValue(value);
  return normalized ? normalized.split(" ") : [];
}

export function buildSearchFieldIndex(value: string | null | undefined): SearchFieldIndex {
  const normalized = normalizeSearchValue(value);
  return {
    normalized,
    tokens: normalized ? normalized.split(" ") : []
  };
}

export function buildSearchIndex(items: SearchDocument[]): SearchIndexDocument[] {
  return items.map((item, position) => ({
    ...item,
    position,
    search: {
      title: buildSearchFieldIndex(item.title),
      tags: buildSearchFieldIndex((item.tags ?? []).join(" ")),
      date: buildSearchFieldIndex(buildExpandedDateSearchText(item)),
      description: buildSearchFieldIndex(item.description),
      excerpt: buildSearchFieldIndex(item.excerpt),
      content: buildSearchFieldIndex(item.content)
    }
  }));
}

function scoreFieldToken(field: SearchFieldIndex, token: string) {
  if (!field.normalized || !token) return 0;

  if (field.tokens.includes(token)) {
    return 8;
  }

  if (token.length >= 2 && field.tokens.some((candidate) => candidate.startsWith(token))) {
    return 5;
  }

  if (token.length >= 4 && field.tokens.some((candidate) => candidate.includes(token))) {
    return 2;
  }

  return 0;
}

function hasAdjacentExactTokens(field: SearchFieldIndex, queryTokens: string[]) {
  if (!field.tokens.length || queryTokens.length <= 1) return false;

  for (let index = 0; index <= field.tokens.length - queryTokens.length; index += 1) {
    const slice = field.tokens.slice(index, index + queryTokens.length);
    if (slice.every((token, offset) => token === queryTokens[offset])) {
      return true;
    }
  }

  return false;
}

/**
 * Search should feel deterministic for known posts, not "fuzzy" in a way that
 * buries exact title/tag/date matches under random body-text noise.
 */
export function scoreSearchDocument(
  item: SearchIndexDocument,
  normalizedQuery: string,
  queryTokens: string[]
) {
  let score = 0;

  for (const token of queryTokens) {
    let tokenScore = 0;

    for (const [fieldName, weight] of Object.entries(SEARCH_WEIGHTS)) {
      tokenScore += scoreFieldToken(
        item.search[fieldName as keyof typeof SEARCH_WEIGHTS],
        token
      ) * weight;
    }

    if (tokenScore === 0) {
      return -1;
    }

    score += tokenScore;
  }

  if (item.search.title.normalized === normalizedQuery) {
    score += 220;
  }

  if (item.search.tags.normalized === normalizedQuery) {
    score += 180;
  }

  if (item.search.date.normalized.includes(normalizedQuery)) {
    score += 140;
  }

  if (hasAdjacentExactTokens(item.search.title, queryTokens)) {
    score += 120;
  }

  if (hasAdjacentExactTokens(item.search.tags, queryTokens)) {
    score += 90;
  }

  if (hasAdjacentExactTokens(item.search.date, queryTokens)) {
    score += 110;
  }

  if (hasAdjacentExactTokens(item.search.description, queryTokens)) {
    score += 45;
  }

  if (hasAdjacentExactTokens(item.search.excerpt, queryTokens)) {
    score += 28;
  }

  if (hasAdjacentExactTokens(item.search.content, queryTokens)) {
    score += 16;
  }

  return score;
}

export function searchDocuments(items: SearchIndexDocument[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  const queryTokens = splitSearchTokens(query);

  if (!normalizedQuery || queryTokens.length === 0) {
    return [];
  }

  return items
    .map((item) => ({
      ...item,
      score: scoreSearchDocument(item, normalizedQuery, queryTokens)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.position - right.position)
    .slice(0, 8);
}
