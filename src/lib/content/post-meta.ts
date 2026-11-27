import { resolveEntryTitle, stripLeadingMarkdownTitle } from "../document-title.ts";
import { resolvePublicationDate } from "../publication.ts";
import {
  formatDate,
  formatIsoDate,
  readingTimeFromMarkdown,
  resolvePostDate,
  type PostDate
} from "./format.ts";

/** Everything a page surface shows or announces about one post entry. */
export type PostMetaSource = {
  body?: string | null;
  data: {
    title: string;
    date: Date;
    publishDate?: Date;
    lastmod?: Date;
  };
};

export type PostMeta = {
  /** Resolved document title: frontmatter and leading H1 in lockstep. */
  title: string;
  /** Canonical publication date: publishDate wins when set. */
  publicationDate: Date;
  /** ISO date of the publication, for feeds and structured data. */
  publicationIso: string;
  /** Publication date as readers see it, always labelled. */
  publicationLabel: string;
  /** Displayed date: publication unless lastmod is strictly later. */
  postDate: PostDate;
  /** ISO date of the displayed date, for datetime attributes. */
  displayIso: string;
  /** Reading minutes from visible prose, without the leading H1. */
  readingMinutes: number;
};

export function derivePostMeta(entry: PostMetaSource): PostMeta {
  const publicationDate = resolvePublicationDate(entry.data);
  const postDate = resolvePostDate(publicationDate, entry.data.lastmod);

  return {
    title: resolveEntryTitle(entry),
    publicationDate,
    publicationIso: formatIsoDate(publicationDate),
    publicationLabel: `Publié le ${formatDate(publicationDate)}`,
    postDate,
    displayIso: formatIsoDate(postDate.date),
    readingMinutes: readingTimeFromMarkdown(stripLeadingMarkdownTitle(entry.body ?? ""))
  };
}
