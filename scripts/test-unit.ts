import { testDocuments } from "./test-unit/documents.ts";
import { testHtml } from "./test-unit/html.ts";
import { testMermaid } from "./test-unit/mermaid.ts";

testDocuments();
testHtml();
testMermaid();

console.log("test:unit passed");
