import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const rootDir = process.cwd();
export const distDir = path.join(rootDir, "dist");

export function assertFile(relativePath: string) {
  const fullPath = path.join(rootDir, relativePath);
  assert.ok(fs.existsSync(fullPath), `Missing required file: ${relativePath}`);
  return fullPath;
}

export function readFile(relativePath: string) {
  return fs.readFileSync(assertFile(relativePath), "utf8");
}

export function readAbsoluteFile(absolutePath: string) {
  assert.ok(fs.existsSync(absolutePath), `Missing required file: ${absolutePath}`);
  return fs.readFileSync(absolutePath, "utf8");
}

export function assertIncludes(text: string, expected: string, label: string) {
  assert.ok(text.includes(expected), `Expected ${label} to include: ${expected}`);
}

export function readJson<T = unknown>(relativePath: string): T {
  return JSON.parse(readFile(relativePath)) as T;
}

export function htmlFiles(dir = distDir): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return htmlFiles(fullPath);
    }

    return entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

export function executableInlineScriptHashesFromHtml(html: string) {
  return [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter((match) => {
      const attributes = match[1] ?? "";
      const body = match[2] ?? "";

      return (
        body.trim() &&
        !/src=/.test(attributes) &&
        !/type=["']application\/ld\+json["']/.test(attributes)
      );
    })
    .map((match) =>
      `sha256-${crypto.createHash("sha256").update(match[2]).digest("base64")}`
    );
}

export function executableInlineScriptHashes(relativePath: string) {
  return executableInlineScriptHashesFromHtml(readFile(relativePath));
}

export function representativePostPath(): string | null {
  const postsDir = path.join(distDir, "articles");
  const rawPostsDir = path.join(distDir, "raw", "posts");

  if (!fs.existsSync(postsDir) || !fs.existsSync(rawPostsDir)) {
    return null;
  }

  // Raw exports only exist for published posts, so pagination directories
  // such as /articles/2/ never qualify as a representative post.
  const slugs = fs
    .readdirSync(rawPostsDir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.slice(0, -".md".length))
    .sort();

  for (const slug of slugs) {
    const candidate = path.join(postsDir, slug, "index.html");

    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function hrefMatches(html: string) {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/g, "");
  return [
    ...withoutScripts.matchAll(/href="([^"]+)"/g),
    ...withoutScripts.matchAll(/href='([^']+)'/g)
  ]
    .map((match) => match[1])
    .filter((href) => !href.includes("${"));
}

function resolveInternalHref(href: string): string | null {
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:") ||
    /^https?:\/\//.test(href)
  ) {
    return null;
  }

  const [pathname] = href.split(/[?#]/);
  const normalized = pathname || "/";

  if (normalized === "/") {
    return path.join(distDir, "index.html");
  }

  if (path.extname(normalized)) {
    return path.join(distDir, normalized.replace(/^\//, ""));
  }

  const trimmed = normalized.replace(/\/$/, "").replace(/^\//, "");
  const directFile = path.join(distDir, trimmed);

  if (fs.existsSync(directFile) && fs.statSync(directFile).isFile()) {
    return directFile;
  }

  return path.join(distDir, trimmed, "index.html");
}

export function assertInternalLinks() {
  for (const file of htmlFiles()) {
    const html = fs.readFileSync(file, "utf8");
    const hrefs = hrefMatches(html);

    for (const href of hrefs) {
      const resolved = resolveInternalHref(href);
      if (!resolved) {
        continue;
      }

      assert.ok(fs.existsSync(resolved), `Broken internal link in ${file}: ${href}`);
    }
  }
}
