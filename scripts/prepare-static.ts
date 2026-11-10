import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { validateMarkdownTitle } from "../src/lib/document-title.ts";
import { mermaidAccessibilityErrors } from "../src/lib/content/mermaid.ts";
import {
  buildAliasRedirects,
  findMarkdownFiles,
  getPublishedMarkdownEntries,
  stripFrontmatter,
  type MarkdownPostEntry
} from "../src/lib/post-files.ts";
import { buildLegacyRedirectLines } from "../src/lib/legacy-redirects.ts";

const cwd = process.cwd();
const contentRoot = path.join(cwd, "src/content/posts");
const pagesRoot = path.join(cwd, "src/content/pages");
const redirectsPath = path.join(cwd, "public/_redirects");
const licenseSource = path.join(cwd, "LICENSE");
const licenseTarget = path.join(cwd, "public/LICENSE.txt");
// The extensionless path served as application/octet-stream; drop the stale
// artifact left behind by older builds once the .txt copy is in place.
const legacyLicenseTarget = path.join(cwd, "public/LICENSE");
const licensesSourceDir = path.join(cwd, "LICENSES");
const licensesTargetDir = path.join(cwd, "public/LICENSES");
const rawPostsRoot = path.join(cwd, "public/raw/posts");
const tempFilePrefix = ".prepare-static-";

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}

function createTempFilePath(targetPath: string) {
  return path.join(
    path.dirname(targetPath),
    `${tempFilePrefix}${process.pid}-${randomUUID()}-${path.basename(targetPath)}`
  );
}

async function writeFileAtomically(targetPath: string, content: string) {
  const tempPath = createTempFilePath(targetPath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  try {
    await fs.writeFile(tempPath, content, "utf8");
    await fs.rename(tempPath, targetPath);
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
  }
}

async function copyFileAtomically(sourcePath: string, targetPath: string) {
  const tempPath = createTempFilePath(targetPath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  try {
    await fs.copyFile(sourcePath, tempPath);
    await fs.rename(tempPath, targetPath);
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
  }
}

async function listDirectoryEntries(dirPath: string) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function pruneDirectoryFiles(dirPath: string, expectedFileNames: Set<string>) {
  const entries = await listDirectoryEntries(dirPath);

  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .filter((entry) => !entry.name.startsWith(tempFilePrefix))
      .filter((entry) => !expectedFileNames.has(entry.name))
      .map(async (entry) => {
        try {
          await fs.rm(path.join(dirPath, entry.name), { force: true });
        } catch (error) {
          if (isErrnoException(error) && error.code === "ENOENT") {
            return;
          }

          throw error;
        }
      })
  );
}

async function buildRedirectLines(entries: MarkdownPostEntry[]) {
  const lines: string[] = [];

  for (const [alias, target] of buildAliasRedirects(entries)) {
    lines.push(`${alias} ${target} 301`);
  }

  lines.push(...buildLegacyRedirectLines());

  return `${lines.join("\n")}\n`;
}

async function writeRawMarkdown(entries: MarkdownPostEntry[]) {
  await fs.mkdir(rawPostsRoot, { recursive: true });

  const rawPostFiles = entries.map((entry) => ({
    fileName: `${entry.slug}.md`,
    content: entry.bodyMarkdown
  }));

  await Promise.all(
    rawPostFiles.map((entry) =>
      writeFileAtomically(path.join(rawPostsRoot, entry.fileName), entry.content)
    )
  );

  await pruneDirectoryFiles(
    rawPostsRoot,
    new Set(rawPostFiles.map((entry) => entry.fileName))
  );
}

async function copyLicenseFiles() {
  await fs.mkdir(licensesTargetDir, { recursive: true });

  const entries = await listDirectoryEntries(licensesSourceDir);
  const licenseFiles = entries.filter((entry) => entry.isFile());

  await Promise.all(
    licenseFiles.map((entry) =>
      copyFileAtomically(
        path.join(licensesSourceDir, entry.name),
        path.join(licensesTargetDir, entry.name)
      )
    )
  );

  await pruneDirectoryFiles(
    licensesTargetDir,
    new Set(licenseFiles.map((entry) => entry.name))
  );
}

/**
 * Walk every Markdown file below `rootDir` and run one contract per file. The
 * contract receives the body without frontmatter, the frontmatter title, and
 * the display label, and throws to make a violation fatal before any build
 * artifact is written.
 */
async function validateMarkdownFiles(
  rootDir: string,
  validate: (body: string, title: string, label: string) => void
) {
  const files = await findMarkdownFiles(rootDir);

  await Promise.all(
    files.map(async (file) => {
      const label = path.relative(cwd, file);
      const markdown = await fs.readFile(file, "utf8");
      const { data } = matter(markdown);

      validate(stripFrontmatter(markdown), String(data.title ?? ""), label);
    })
  );
}

/** The Markdown document itself is the editorial source of truth for the title. */
function validateTitleContract(body: string, title: string, label: string) {
  validateMarkdownTitle(body, title, { label, requireLeadingTitle: true });
}

/**
 * A diagram without a name and a description is an empty graphic for
 * assistive technologies.
 */
function validateMermaidContract(body: string, _title: string, label: string) {
  const errors = mermaidAccessibilityErrors(body);

  if (errors.length > 0) {
    throw new Error(`${label}: ${errors.join("; ")}`);
  }
}

await validateMarkdownFiles(contentRoot, validateTitleContract);
await validateMarkdownFiles(pagesRoot, validateTitleContract);
await validateMarkdownFiles(contentRoot, validateMermaidContract);
await validateMarkdownFiles(pagesRoot, validateMermaidContract);
const publishedEntries = await getPublishedMarkdownEntries(contentRoot);
await copyFileAtomically(licenseSource, licenseTarget);
await fs.rm(legacyLicenseTarget, { force: true });
await copyLicenseFiles();
await writeFileAtomically(redirectsPath, await buildRedirectLines(publishedEntries));
await writeRawMarkdown(publishedEntries);
console.log(
  "prepare-static: wrote public/_redirects, public/LICENSE.txt, public/LICENSES, and public/raw/posts"
);
