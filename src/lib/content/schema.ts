import { z } from "astro/zod";
import { POST_CATEGORIES } from "./taxonomy.ts";

/**
 * Frontmatter contract for posts, shared by the Astro content collections and
 * the build scripts. One reader, one shape: raw Markdown artifacts and
 * rendered pages cannot disagree on dates, slugs inputs, or publication.
 */
export const POST_SCHEMA = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  draft: z.boolean(),
  description: z.string().min(1),
  category: z.enum(POST_CATEGORIES),
  tags: z.array(z.string().min(1)).min(1),
  lastmod: z.coerce.date().optional(),
  aliases: z.array(z.string().min(1)).optional(),
  publishDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional()
});

export type PostFrontmatter = z.infer<typeof POST_SCHEMA>;

export const PAGE_SCHEMA = z.object({
  title: z.string().min(1),
  description: z.string().min(1).optional()
});

export type PageFrontmatter = z.infer<typeof PAGE_SCHEMA>;
