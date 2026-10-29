// @ts-check

/**
 * @typedef {"title" | "category" | "tags" | "date" | "description" | "excerpt" | "content"} SearchField
 */

/**
 * @typedef {object} SearchFieldIndex
 * @property {string} normalized
 * @property {string[]} tokens
 */

/**
 * @typedef {object} SearchDocument
 * @property {string} title
 * @property {string} description
 * @property {string} category
 * @property {string[]} tags
 * @property {string} url
 * @property {string} date
 * @property {string} dateLabel
 * @property {string} excerpt
 * @property {string} content
 */

/**
 * @typedef {SearchDocument & { position: number; search: Record<SearchField, SearchFieldIndex> }} SearchIndexDocument
 */

/**
 * @typedef {SearchIndexDocument & { score: number }} RankedSearchDocument
 */

/** @type {SearchField[]} */
const SEARCH_FIELDS = ["title", "category", "tags", "date", "description", "excerpt", "content"];

const PREFIX_MIN_LENGTH = 2;
const SUBSTRING_MIN_LENGTH = 4;
const DEFAULT_RESULT_LIMIT = 8;

/**
 * Readers usually remember a post by title, tag, or a rough date before they
 * remember exact prose, so the ranking deliberately favors editorial metadata.
 * Every weight is data so the ordering stays explicit and testable.
 *
 * @type {Record<SearchField, number>}
 */
export const FIELD_WEIGHTS = {
  title: 24,
  category: 20,
  tags: 18,
  date: 14,
  description: 8,
  excerpt: 5,
  content: 2
};

/**
 * How a single query token scores against one field.
 *
 * @type {{ exact: number; prefix: number; substring: number }}
 */
export const TOKEN_MATCH_SCORES = { exact: 8, prefix: 5, substring: 2 };

/**
 * Bonus when the query tokens appear adjacent, in order, inside a field.
 *
 * @type {Record<SearchField, number>}
 */
export const ADJACENT_MATCH_BONUSES = {
  title: 120,
  category: 100,
  tags: 90,
  date: 110,
  description: 45,
  excerpt: 28,
  content: 16
};

/**
 * Bonus when a whole field equals the query, or, for dates, contains it.
 *
 * @type {Array<{ field: SearchField; kind: "equals" | "contains"; bonus: number }>}
 */
export const EXACT_MATCH_RULES = [
  { field: "title", kind: "equals", bonus: 220 },
  { field: "category", kind: "equals", bonus: 190 },
  { field: "tags", kind: "equals", bonus: 180 },
  { field: "date", kind: "contains", bonus: 140 }
];

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function normalizeSearchValue(value) {
  return `${value ?? ""}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} value
 * @returns {string[]}
 */
export function splitSearchTokens(value) {
  const normalized = normalizeSearchValue(value);
  return normalized ? normalized.split(" ") : [];
}

/**
 * @param {string | null | undefined} value
 * @returns {SearchFieldIndex}
 */
export function buildSearchFieldIndex(value) {
  const normalized = normalizeSearchValue(value);
  return {
    normalized,
    tokens: normalized ? normalized.split(" ") : []
  };
}

/**
 * @param {SearchFieldIndex} field
 * @param {string} token
 * @returns {number}
 */
function scoreFieldToken(field, token) {
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

/**
 * @param {SearchFieldIndex} field
 * @param {string[]} queryTokens
 * @returns {boolean}
 */
function hasAdjacentExactTokens(field, queryTokens) {
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
 *
 * @param {SearchIndexDocument} item
 * @param {string} normalizedQuery
 * @param {string[]} queryTokens
 * @returns {number}
 */
export function scoreSearchDocument(item, normalizedQuery, queryTokens) {
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

/**
 * @param {SearchIndexDocument[]} items
 * @param {string} query
 * @param {number} [limit]
 * @returns {RankedSearchDocument[]}
 */
export function searchDocuments(items, query, limit = DEFAULT_RESULT_LIMIT) {
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
