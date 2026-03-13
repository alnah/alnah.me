export function isBefore(date, now = new Date()) {
  return !date || date.getTime() <= now.getTime();
}

export function isAfter(date, now = new Date()) {
  return !date || date.getTime() > now.getTime();
}

export function resolvePublicationDate(data) {
  return data.publishDate ?? data.date;
}

export function isPublishedData(data, now = new Date()) {
  return (
    !data.draft &&
    isBefore(data.publishDate, now) &&
    isAfter(data.expiryDate, now)
  );
}
