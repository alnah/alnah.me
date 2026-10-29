// @ts-check

/**
 * Publication dates as they reach the domain: any field may be missing while
 * the raw Markdown frontmatter is being normalized.
 *
 * @typedef {object} PublicationData
 * @property {Date} [date]
 * @property {Date} [publishDate]
 * @property {Date} [expiryDate]
 * @property {boolean} [draft]
 */

/**
 * A publication whose base date is known, as produced by the content schema.
 *
 * @typedef {object} DatedPublication
 * @property {Date} date
 * @property {Date} [publishDate]
 */

/**
 * @param {Date | undefined} date
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isBefore(date, now = new Date()) {
  return !date || date.getTime() <= now.getTime();
}

/**
 * @param {Date | undefined} date
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isAfter(date, now = new Date()) {
  return !date || date.getTime() > now.getTime();
}

/**
 * @param {DatedPublication} data
 * @returns {Date}
 */
export function resolvePublicationDate(data) {
  return data.publishDate ?? data.date;
}

/**
 * @param {PublicationData} data
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isPublishedData(data, now = new Date()) {
  return (
    !data.draft &&
    isBefore(data.publishDate, now) &&
    isAfter(data.expiryDate, now)
  );
}
