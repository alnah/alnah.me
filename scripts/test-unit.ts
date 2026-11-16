import { testDocuments } from "./test-unit/documents.ts";
import { testGitHubView } from "./test-unit/github-view.ts";
import { testHtml } from "./test-unit/html.ts";
import { testLinks } from "./test-unit/links.ts";
import { testMermaid } from "./test-unit/mermaid.ts";
import { testFootnotes } from "./test-unit/footnotes.ts";
import { testSeo } from "./test-unit/seo.ts";
import { testSitemap } from "./test-unit/sitemap.ts";
import { testTaxonomy } from "./test-unit/taxonomy.ts";
import { testTextFit } from "./test-unit/text-fit.ts";
import { testPostDate } from "./test-unit/post-date.ts";

testDocuments();
testGitHubView();
testHtml();
testLinks();
testMermaid();
await testFootnotes();
testSeo();
testSitemap();
testTaxonomy();
testTextFit();
testPostDate();

console.log("test:unit passed");
