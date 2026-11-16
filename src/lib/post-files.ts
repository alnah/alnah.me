import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { normalizeAlias } from "./aliases.ts";
import { POST_SCHEMA, type PostFrontmatter } from "./content/schema.ts";
import { isErrnoException } from "./errno.ts";
import { isPublishedData } from "./publication.ts";
import { postPath, postSlugFromPath, rawPostPath } from "./site-paths.ts";

export type MarkdownPostEntry = {
  file: string;
  markdown: string;
  slug: string;
  aliases: string[];
  category: PostFrontmatter["category"];
  tags: string[];
  bodyMarkdown: string;
  postData: PostFrontmatter;
};

export type AliasSourceEntry = {
  slug: string;
  aliases: string[];
};

export async function findMarkdownFiles(dir: string): Promise<string[]> {
  let entries;

  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return findMarkdownFiles(fullPath);
      }

      return fullPath.endsWith(".md") ? [fullPath] : [];
    })
  );

  return files.flat();
}

/**
 * Raw "reuse this post" exports should stay readable and pasteable. Stripping
 * frontmatter keeps the reusable document focused on the article itself.
 */
export function stripFrontmatter(markdown: string) {
  return matter(markdown).content.replace(/^\n+/, "");
}

function parseMarkdownPost(markdown: string, slug: string) {
  const parsed = matter(markdown);
  const data = POST_SCHEMA.parse(parsed.data);

  return {
    slug,
    aliases: data.aliases ?? [],
    category: data.category,
    tags: data.tags,
    bodyMarkdown: parsed.content.replace(/^\n+/, ""),
    postData: data
  };
}

async function readMarkdownPost(file: string) {
  const markdown = await fs.readFile(file, "utf8");
  const slug = path.basename(path.dirname(file));

  return {
    file,
    markdown,
    ...parseMarkdownPost(markdown, slug)
  };
}

/** Every Markdown post on disk, published or not. */
export async function getMarkdownEntries(contentRoot: string) {
  const files = await findMarkdownFiles(contentRoot);
  return Promise.all(files.map((file) => readMarkdownPost(file)));
}

export async function getPublishedMarkdownEntries(contentRoot: string) {
  const entries = await getMarkdownEntries(contentRoot);

  return entries.filter((entry) => isPublishedData(entry.postData));
}

/**
 * Redirect collisions are a publishing bug, not a runtime edge case. We fail
 * hard here so canonical URLs stay predictable for readers and crawlers.
 */
export function buildAliasRedirects(
  entries: AliasSourceEntry[]
): Array<[string, string]> {
  const aliases = new Map<string, string>();

  for (const entry of entries) {
    const canonicalTarget = postPath(entry.slug);

    for (const rawAlias of entry.aliases) {
      const alias = normalizeAlias(rawAlias);
      if (!alias || alias === canonicalTarget) {
        continue;
      }

      const existing = aliases.get(alias);
      if (existing && existing !== canonicalTarget) {
        throw new Error(`Alias collision: ${alias} -> ${existing} and ${canonicalTarget}`);
      }

      aliases.set(alias, canonicalTarget);
    }
  }

  return [...aliases.entries()].sort(([left], [right]) => left.localeCompare(right));
}

/**
 * Reuse exports follow their post slug. When a post is renamed, its alias
 * keeps the article URL alive; the old raw export must redirect too, so
 * shared download links keep working.
 */
export function buildRawAliasRedirects(
  aliasRedirects: Array<[string, string]>
): Array<[string, string]> {
  const rawRedirects: Array<[string, string]> = [];

  for (const [alias, target] of aliasRedirects) {
    const aliasSlug = postSlugFromPath(alias);
    const targetSlug = postSlugFromPath(target);

    if (!aliasSlug || !targetSlug || aliasSlug === targetSlug) {
      continue;
    }

    rawRedirects.push([rawPostPath(aliasSlug), rawPostPath(targetSlug)]);
  }

  return rawRedirects;
}
