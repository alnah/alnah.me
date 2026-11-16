import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { SITE } from "../src/config/site.ts";
import { anchorHrefs, parsePage } from "./page-dom.ts";

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

/** One `_headers` block, matched on its selector line. */
export function headerSection(headers: string, selector: string) {
  for (const block of headers.split("\n\n")) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    if (lines[0] === selector) {
      return block;
    }
  }

  return "";
}

/** Map a built HTML file to its public URL path. */
export function htmlPathToUrlPath(file: string) {
  const relative = path.relative(distDir, file);

  if (relative === "index.html") {
    return "/";
  }

  if (relative.endsWith(`${path.sep}index.html`)) {
    return `/${relative.slice(0, -"index.html".length).split(path.sep).join("/")}`;
  }

  return `/${relative.split(path.sep).join("/")}`;
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

export function readPngDimensions(relativePath: string) {
  const buffer = fs.readFileSync(assertFile(relativePath));
  assert.equal(
    buffer.subarray(1, 4).toString("ascii"),
    "PNG",
    `${relativePath} is not a PNG`
  );

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
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

function hrefMatches(html: string) {
  return anchorHrefs(parsePage(html)).filter((href) => !href.includes("${"));
}

/** Absolute links to the site itself are internal and must be checked too. */
function internalPathname(href: string) {
  if (/^https?:\/\//.test(href)) {
    const url = new URL(href);
    return url.origin === new URL(SITE.siteUrl).origin ? url.pathname || "/" : null;
  }

  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return null;
  }

  return href.split(/[?#]/)[0] || "/";
}

function resolveInternalHref(href: string): string | null {
  const normalized = internalPathname(href);

  if (!normalized) {
    return null;
  }

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
