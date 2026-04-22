export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('fr', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export function formatIsoDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function readingTimeFromText(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchDateText(date: Date) {
  const year = String(date.getUTCFullYear());
  const monthNumber = String(date.getUTCMonth() + 1);
  const paddedMonth = monthNumber.padStart(2, "0");
  const dayNumber = String(date.getUTCDate());
  const paddedDay = dayNumber.padStart(2, "0");
  const shortMonth = new Intl.DateTimeFormat('fr', {
    month: 'short',
    timeZone: 'UTC'
  }).format(date);
  const longMonth = new Intl.DateTimeFormat('fr', {
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

export function excerptFromMarkdown(markdown: string, maxLength = 180) {
  const plainText = markdownToPlainText(markdown);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trim()}...`;
}
