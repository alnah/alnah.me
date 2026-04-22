import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const rootDir = process.cwd();
export const distDir = path.join(rootDir, "dist");

export function assertFile(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  assert.ok(fs.existsSync(fullPath), `Missing required file: ${relativePath}`);
  return fullPath;
}

export function readFile(relativePath) {
  return fs.readFileSync(assertFile(relativePath), "utf8");
}

export function readAbsoluteFile(absolutePath) {
  assert.ok(fs.existsSync(absolutePath), `Missing required file: ${absolutePath}`);
  return fs.readFileSync(absolutePath, "utf8");
}

export function assertIncludes(text, expected, label) {
  assert.ok(text.includes(expected), `Expected ${label} to include: ${expected}`);
}

export function readJson(relativePath) {
  return JSON.parse(readFile(relativePath));
}

export function htmlFiles(dir = distDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return htmlFiles(fullPath);
    }

    return entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

export function executableInlineScriptHashes(relativePath) {
  const html = readFile(relativePath);

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

export function representativePostPath() {
  const postsDir = path.join(distDir, 'articles');
  if (!fs.existsSync(postsDir)) {
    return null;
  }
  const entries = fs.readdirSync(postsDir, { withFileTypes: true });
  const postDir = entries.find(
    (entry) => entry.isDirectory() && entry.name !== '2'
  );

  if (!postDir) {
    return null;
  }

  return path.join(postsDir, postDir.name, 'index.html');
}

function hrefMatches(html) {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/g, "");
  return [
    ...withoutScripts.matchAll(/href="([^"]+)"/g),
    ...withoutScripts.matchAll(/href='([^']+)'/g)
  ]
    .map((match) => match[1])
    .filter((href) => !href.includes("${"));
}

function resolveInternalHref(href) {
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
