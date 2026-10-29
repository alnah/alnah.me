export type SearchField =
  | "title"
  | "category"
  | "tags"
  | "date"
  | "description"
  | "excerpt"
  | "content";

export type SearchFieldIndex = {
  normalized: string;
  tokens: string[];
};

export type SearchDocument = {
  title: string;
  description: string;
  category: string;
  tags: string[];
  url: string;
  date: string;
  dateLabel: string;
  excerpt: string;
  content: string;
};

export type SearchIndexDocument = SearchDocument & {
  position: number;
  search: Record<SearchField, SearchFieldIndex>;
};

export type RankedSearchDocument = SearchIndexDocument & { score: number };

const SEARCH_FIELDS: SearchField[] = [
  "title",
  "category",
  "tags",
  "date",
  "description",
  "excerpt",
  "content"
];

const PREFIX_MIN_LENGTH = 2;
const SUBSTRING_MIN_LENGTH = 4;
const DEFAULT_RESULT_LIMIT = 8;

/**
 * Readers usually remember a post by title, tag, or a rough date before they
 * remember exact prose, so the ranking deliberately favors editorial metadata.
 * Every weight is data so the ordering stays explicit and testable.
 */
export const FIELD_WEIGHTS: Record<SearchField, number> = {
  title: 24,
  category: 20,
  tags: 18,
  date: 14,
  description: 8,
  excerpt: 5,
  content: 2
};

/** How a single query token scores against one field. */
export const TOKEN_MATCH_SCORES = { exact: 8, prefix: 5, substring: 2 };

/** Bonus when the query tokens appear adjacent, in order, inside a field. */
export const ADJACENT_MATCH_BONUSES: Record<SearchField, number> = {
  title: 120,
  category: 100,
  tags: 90,
  date: 110,
  description: 45,
  excerpt: 28,
  content: 16
};

/** Bonus when a whole field equals the query, or, for dates, contains it. */
export const EXACT_MATCH_RULES: Array<{
  field: SearchField;
  kind: "equals" | "contains";
  bonus: number;
}> = [
  { field: "title", kind: "equals", bonus: 220 },
  { field: "category", kind: "equals", bonus: 190 },
  { field: "tags", kind: "equals", bonus: 180 },
  { field: "date", kind: "contains", bonus: 140 }
];

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

function scoreFieldToken(field: SearchFieldIndex, token: string) {
  if (!field.normalized || !token) return 0;

  if (field.tokens.includes(token)) {
    return TOKEN_MATCH_SCORES.exact;
  }

  if (
    token.length >= PREFIX_MIN_LENGTH &&
    field.tokens.some((candidate) => candidate.startsWith(token))
  ) {
    return TOKEN_MATCH_SCORES.prefix;
  }

  if (
    token.length >= SUBSTRING_MIN_LENGTH &&
    field.tokens.some((candidate) => candidate.includes(token))
  ) {
    return TOKEN_MATCH_SCORES.substring;
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

    for (const field of SEARCH_FIELDS) {
      tokenScore += scoreFieldToken(item.search[field], token) * FIELD_WEIGHTS[field];
    }

    if (tokenScore === 0) {
      return -1;
    }

    score += tokenScore;
  }

  for (const rule of EXACT_MATCH_RULES) {
    const field = item.search[rule.field];
    const matched =
      rule.kind === "equals"
        ? field.normalized === normalizedQuery
        : field.normalized.includes(normalizedQuery);

    if (matched) {
      score += rule.bonus;
    }
  }

  for (const field of SEARCH_FIELDS) {
    if (hasAdjacentExactTokens(item.search[field], queryTokens)) {
      score += ADJACENT_MATCH_BONUSES[field];
    }
  }

  return score;
}

export function searchDocuments(
  items: SearchIndexDocument[],
  query: string,
  limit = DEFAULT_RESULT_LIMIT
): RankedSearchDocument[] {
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
    .slice(0, limit);
}
