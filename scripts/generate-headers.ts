import fs from "node:fs";
import path from "node:path";
import { distDir, executableInlineScriptHashesFromHtml, htmlFiles } from "./checks.ts";

const headersPath = path.join(distDir, "_headers");
const SCRIPT_SRC_PATTERN = /script-src(?![\w-])([^;]*);/;

function collectInlineScriptHashes() {
  const hashes = new Set<string>();

  for (const file of htmlFiles()) {
    const html = fs.readFileSync(file, "utf8");

    for (const hash of executableInlineScriptHashesFromHtml(html)) {
      hashes.add(hash);
    }
  }

  return [...hashes].sort();
}

/**
 * The header template ships without hashes, so the built output is the single
 * source of truth. Any stale hash left in the template is dropped first.
 */
function injectScriptHashes(headers: string, hashes: string[]) {
  const tokens = hashes.map((hash) => `'${hash}'`);

  return headers
    .split("\n")
    .map((line) => {
      if (!line.includes("Content-Security-Policy:")) {
        return line;
      }

      return line.replace(SCRIPT_SRC_PATTERN, (_match, sources) => {
        const kept = sources
          .trim()
          .split(/\s+/)
          .filter((source: string) => source && !source.startsWith("'sha256-"));

        const selfIndex = kept.indexOf("'self'");
        kept.splice(selfIndex >= 0 ? selfIndex + 1 : kept.length, 0, ...tokens);

        return `script-src ${kept.join(" ")};`;
      });
    })
    .join("\n");
}

if (!fs.existsSync(headersPath)) {
  throw new Error("dist/_headers is missing; run the build before generating headers");
}

const hashes = collectInlineScriptHashes();
const headers = fs.readFileSync(headersPath, "utf8");
const nextHeaders = injectScriptHashes(headers, hashes);

fs.writeFileSync(headersPath, nextHeaders, "utf8");
console.log(`generate-headers: injected ${hashes.length} inline script hash(es) into dist/_headers`);
