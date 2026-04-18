import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { validateMarkdownTitle } from "../src/lib/document-title.js";
import { buildAliasRedirects, findMarkdownFiles, getPublishedMarkdownEntries, stripFrontmatter } from "../src/lib/post-files.js";

const cwd = process.cwd();
const contentRoot = path.join(cwd, "src/content/posts");
const pagesRoot = path.join(cwd, "src/content/pages");
const redirectsPath = path.join(cwd, "public/_redirects");
const licenseSource = path.join(cwd, "LICENSE");
const licenseTarget = path.join(cwd, "public/LICENSE");
const licensesSourceDir = path.join(cwd, "LICENSES");
const licensesTargetDir = path.join(cwd, "public/LICENSES");
const rawPostsRoot = path.join(cwd, "public/raw/posts");
const tempFilePrefix = ".prepare-static-";

function createTempFilePath(targetPath) {
  return path.join(
    path.dirname(targetPath),
    `${tempFilePrefix}${process.pid}-${randomUUID()}-${path.basename(targetPath)}`
  );
}

async function writeFileAtomically(targetPath, content) {
  const tempPath = createTempFilePath(targetPath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  try {
    await fs.writeFile(tempPath, content, "utf8");
    await fs.rename(tempPath, targetPath);
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
  }
}

async function copyFileAtomically(sourcePath, targetPath) {
  const tempPath = createTempFilePath(targetPath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  try {
    await fs.copyFile(sourcePath, tempPath);
    await fs.rename(tempPath, targetPath);
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
  }
}

async function listDirectoryEntries(dirPath) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function pruneDirectoryFiles(dirPath, expectedFileNames) {
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
          if (error && typeof error === "object" && error.code === "ENOENT") {
            return;
          }

          throw error;
        }
      })
  );
}

async function buildRedirectLines(entries) {
  const lines = [];

  for (const [alias, target] of buildAliasRedirects(entries)) {
    lines.push(`${alias} ${target} 301`);
  }

  return `${lines.join("\n")}\n`;
}

async function writeRawMarkdown(entries) {
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
 * The site now treats the Markdown document itself as the editorial source of
 * truth, so we validate titles before any build artifact is written.
 */
async function validateMarkdownTitleContract(rootDir) {
  const files = await findMarkdownFiles(rootDir);

  await Promise.all(
    files.map(async (file) => {
      const markdown = await fs.readFile(file, "utf8");
      const { data } = matter(markdown);

      validateMarkdownTitle(stripFrontmatter(markdown), data.title, {
        label: path.relative(cwd, file),
        requireLeadingTitle: true
      });
    })
  );
}

await validateMarkdownTitleContract(contentRoot);
await validateMarkdownTitleContract(pagesRoot);
const publishedEntries = await getPublishedMarkdownEntries(contentRoot);
await copyFileAtomically(licenseSource, licenseTarget);
await copyLicenseFiles();
await writeFileAtomically(redirectsPath, await buildRedirectLines(publishedEntries));
await writeRawMarkdown(publishedEntries);
console.log(
  "prepare-static: wrote public/_redirects, public/LICENSE, public/LICENSES, and public/raw/posts"
);
