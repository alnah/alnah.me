import { testDocuments } from "./test-unit/documents.ts";
import { testHtml } from "./test-unit/html.ts";
import { testLinks } from "./test-unit/links.ts";
import { testMermaid } from "./test-unit/mermaid.ts";
import { testTaxonomy } from "./test-unit/taxonomy.ts";

testDocuments();
testHtml();
testLinks();
testMermaid();
testTaxonomy();

console.log("test:unit passed");
