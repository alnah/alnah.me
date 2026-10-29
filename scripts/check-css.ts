import fs from "node:fs";
import path from "node:path";

/**
 * CSS conventions are easy to break silently: a stray hex color, a one-off
 * breakpoint, or a hardcoded radius drifts the design system without failing
 * the build. This check makes those violations loud before they ship.
 */
const rootDir = process.cwd();
const srcDir = path.join(rootDir, "src");
const stylesDir = path.join(srcDir, "styles");
const tokensFile = path.join(stylesDir, "tokens.css");

const allowedBreakpoints = new Set(["360", "480", "720", "900", "901"]);
const rawColorPattern = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\b(?:white|black)\b(?!-)/;
const breakpointPattern = /@media[^{]*?\((?:min|max)-width:\s*(\d+)px\)/g;

const violations: string[] = [];

type CheckCssOptions = {
  allowRawColors?: boolean;
  allowLiterals?: boolean;
};

function checkCss(
  css: string,
  file: string,
  lineOffset = 0,
  { allowRawColors = false, allowLiterals = false }: CheckCssOptions = {}
) {
  const relativeFile = path.relative(rootDir, file);
  const lines = css.split("\n");

  lines.forEach((line, index) => {
    const at = `${relativeFile}:${index + 1 + lineOffset}`;

    if (!allowRawColors && rawColorPattern.test(line)) {
      violations.push(`${at} raw color, use a token: ${line.trim()}`);
    }

    if (line.includes("!important")) {
      violations.push(`${at} !important is not allowed: ${line.trim()}`);
    }

    if (!allowLiterals && /\b999px\b/.test(line)) {
      violations.push(`${at} hardcoded 999px, use var(--radius-pill)`);
    }

    if (!allowLiterals && /\b160ms\b/.test(line)) {
      violations.push(`${at} hardcoded 160ms, use var(--duration-fast)`);
    }
  });

  for (const match of css.matchAll(breakpointPattern)) {
    if (!allowedBreakpoints.has(match[1])) {
      violations.push(
        `${relativeFile} unapproved breakpoint ${match[1]}px (allowed: ${[...allowedBreakpoints].join(", ")})`
      );
    }
  }
}

type StyleBlock = {
  css: string;
  lineOffset: number;
};

function styleBlocks(source: string): StyleBlock[] {
  const blocks: StyleBlock[] = [];
  const pattern = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let match;

  while ((match = pattern.exec(source))) {
    const lineOffset = source.slice(0, match.index).split("\n").length;
    blocks.push({ css: match[1], lineOffset });
  }

  return blocks;
}

function listFiles(dir: string, extension: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return listFiles(fullPath, extension);
    }

    return entry.name.endsWith(extension) ? [fullPath] : [];
  });
}

for (const file of listFiles(stylesDir, ".css")) {
  checkCss(fs.readFileSync(file, "utf8"), file, 0, {
    allowRawColors: file === tokensFile,
    allowLiterals: file === tokensFile
  });
}

for (const file of listFiles(srcDir, ".astro")) {
  for (const block of styleBlocks(fs.readFileSync(file, "utf8"))) {
    checkCss(block.css, file, block.lineOffset);
  }
}

if (violations.length > 0) {
  console.error(`check-css: ${violations.length} violation(s)`);
  for (const violation of violations) {
    console.error(`  ${violation}`);
  }
  process.exit(1);
}

console.log("check-css passed");
