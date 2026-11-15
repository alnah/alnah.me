/**
 * Fit text into a character budget, truncating at a word boundary and
 * appending one ellipsis. Whitespace is normalized first. The budget includes
 * the ellipsis, so the result never exceeds maxLength characters.
 */
export function truncateText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized || maxLength <= 0) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const candidate = normalized.slice(0, Math.max(0, maxLength - 1));
  const lastSpace = candidate.lastIndexOf(" ");
  const cut = lastSpace > 0 ? candidate.slice(0, lastSpace) : candidate;

  return `${cut.trimEnd() || candidate.trimEnd()}…`;
}
