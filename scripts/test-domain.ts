import { testGitHubEvents } from "./test-domain/github.ts";
import { testPublication } from "./test-domain/publication.ts";
import { testRedirects } from "./test-domain/redirects.ts";
import { testSearch } from "./test-domain/search.ts";

testPublication();
testRedirects();
testSearch();
testGitHubEvents();

console.log("test:domain passed");
