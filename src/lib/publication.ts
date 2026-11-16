/**
 * Publication dates as they reach the domain: any field may be missing while
 * the raw Markdown frontmatter is being normalized.
 */
export type PublicationData = {
  date?: Date;
  lastmod?: Date;
  publishDate?: Date;
  expiryDate?: Date;
  draft?: boolean;
};

/** A publication whose base date is known, as produced by the content schema. */
export type DatedPublication = {
  date: Date;
  publishDate?: Date;
};

/**
 * Latest of the given dates. Missing and invalid dates are ignored, ties keep
 * the first known date, and an empty list resolves to undefined.
 */
export function latestOf(dates: Array<Date | undefined>): Date | undefined {
  let latest: Date | undefined;

  for (const date of dates) {
    const time = date?.getTime();

    if (time === undefined || Number.isNaN(time)) {
      continue;
    }

    if (!latest || time > latest.getTime()) {
      latest = date;
    }
  }

  return latest;
}

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
