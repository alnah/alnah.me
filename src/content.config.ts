import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({
    base: "./src/content/posts",
    pattern: "**/*.md"
  }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    draft: z.boolean(),
    description: z.string().min(1),
    tags: z.array(z.string().min(1)).min(1),
    lastmod: z.coerce.date().optional(),
    aliases: z.array(z.string().min(1)).optional(),
    publishDate: z.coerce.date().optional(),
    expiryDate: z.coerce.date().optional(),
    cover: z.string().optional()
  })
});

const pages = defineCollection({
  loader: glob({
    base: "./src/content/pages",
    pattern: "**/*.md"
  }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).optional()
  })
});

export const collections = {
  posts,
  pages
};
