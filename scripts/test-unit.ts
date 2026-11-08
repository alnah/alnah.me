import { testDocuments } from "./test-unit/documents.ts";
import { testHtml } from "./test-unit/html.ts";
import { testLinks } from "./test-unit/links.ts";
import { testMermaid } from "./test-unit/mermaid.ts";

testDocuments();
testHtml();
testLinks();
testMermaid();

console.log("test:unit passed");
