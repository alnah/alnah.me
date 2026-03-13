import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { canonicalPostPath, normalizeAlias } from "./aliases.js";
import { isPublishedData } from "./publication.js";

export async function findMarkdownFiles(dir) {
  let entries;

  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
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

function normalizePublicationData(data) {
  return {
    ...data,
    date: data.date ? new Date(data.date) : undefined,
    publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
    expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined
  };
}

/**
 * Raw "reuse this post" exports should stay readable and pasteable. Stripping
 * frontmatter keeps the reusable document focused on the article itself.
 */
export function stripFrontmatter(markdown) {
  return matter(markdown).content.replace(/^\n+/, "");
}

export function parseMarkdownPost(markdown, slug) {
  const { data } = matter(markdown);
  return {
    slug,
    aliases: Array.isArray(data.aliases) ? data.aliases : [],
    bodyMarkdown: stripFrontmatter(markdown),
    postData: normalizePublicationData(data)
  };
}

export async function readMarkdownPost(file) {
  const markdown = await fs.readFile(file, "utf8");
  const slug = path.basename(path.dirname(file));

  return {
    file,
    markdown,
    ...parseMarkdownPost(markdown, slug)
  };
}

export async function getPublishedMarkdownEntries(contentRoot) {
  const files = await findMarkdownFiles(contentRoot);
  const entries = await Promise.all(files.map((file) => readMarkdownPost(file)));

  return entries.filter((entry) => entry.postData.date && isPublishedData(entry.postData));
}

/**
 * Redirect collisions are a publishing bug, not a runtime edge case. We fail
 * hard here so canonical URLs stay predictable for readers and crawlers.
 */
export function buildAliasRedirects(entries) {
  const aliases = new Map();

  for (const entry of entries) {
    const canonicalTarget = canonicalPostPath(entry.slug);

    for (const rawAlias of entry.aliases) {
      const alias = typeof rawAlias === "string" ? normalizeAlias(rawAlias) : "";
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
