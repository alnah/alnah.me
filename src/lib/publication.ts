/**
 * Publication dates as they reach the domain: any field may be missing while
 * the raw Markdown frontmatter is being normalized.
 */
export type PublicationData = {
  date?: Date;
  publishDate?: Date;
  expiryDate?: Date;
  draft?: boolean;
};

/** A publication whose base date is known, as produced by the content schema. */
export type DatedPublication = {
  date: Date;
  publishDate?: Date;
};

export function isBefore(date: Date | undefined, now = new Date()) {
  return !date || date.getTime() <= now.getTime();
}

export function isAfter(date: Date | undefined, now = new Date()) {
  return !date || date.getTime() > now.getTime();
}

export function resolvePublicationDate(data: DatedPublication) {
  return data.publishDate ?? data.date;
}

export function isPublishedData(data: PublicationData, now = new Date()) {
  return (
    !data.draft &&
    isBefore(data.publishDate, now) &&
    isAfter(data.expiryDate, now)
  );
}
