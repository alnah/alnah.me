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

async function buildRedirectLines(entries) {
  const lines = [];

  for (const [alias, target] of buildAliasRedirects(entries)) {
    lines.push(`${alias} ${target} 301`);
  }

  return `${lines.join("\n")}\n`;
}

async function writeRawMarkdown(entries) {
  await fs.rm(rawPostsRoot, { recursive: true, force: true });
  await fs.mkdir(rawPostsRoot, { recursive: true });

  await Promise.all(
    entries.map((entry) => {
      return fs.writeFile(path.join(rawPostsRoot, `${entry.slug}.md`), entry.bodyMarkdown, "utf8");
    })
  );
}

async function copyLicenseFiles() {
  await fs.rm(licensesTargetDir, { recursive: true, force: true });
  await fs.mkdir(licensesTargetDir, { recursive: true });

  const entries = await fs.readdir(licensesSourceDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map((entry) =>
        fs.copyFile(
          path.join(licensesSourceDir, entry.name),
          path.join(licensesTargetDir, entry.name)
        )
      )
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
await fs.mkdir(path.dirname(licenseTarget), { recursive: true });
await fs.copyFile(licenseSource, licenseTarget);
await copyLicenseFiles();
await fs.writeFile(redirectsPath, await buildRedirectLines(publishedEntries), "utf8");
await writeRawMarkdown(publishedEntries);
console.log(
  "prepare-static: wrote public/_redirects, public/LICENSE, public/LICENSES, and public/raw/posts"
);
