import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { PAGE_SCHEMA, POST_SCHEMA } from "./lib/content/schema.ts";

const posts = defineCollection({
  loader: glob({
    base: "./src/content/posts",
    pattern: "**/*.md"
  }),
  schema: POST_SCHEMA
});

const pages = defineCollection({
  loader: glob({
    base: "./src/content/pages",
    pattern: "**/*.md"
  }),
  schema: PAGE_SCHEMA
});

export const collections = {
  posts,
  pages
};
