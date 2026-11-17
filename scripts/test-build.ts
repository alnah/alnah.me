import { loadBuiltSite } from "./test-build/built-site.ts";
import { checkHomeMetadata } from "./test-build/home-metadata.ts";
import { checkAboutMetadata } from "./test-build/about-metadata.ts";
import { checkPostPages } from "./test-build/post-pages.ts";
import { checkPostCanaries } from "./test-build/post-canaries.ts";
import { checkRedirects } from "./test-build/redirects.ts";
import { checkSecurityHeaders } from "./test-build/security-headers.ts";
import { checkSitemapEntries } from "./test-build/sitemap-entries.ts";
import { checkSearchIndex } from "./test-build/search-index.ts";
import { checkUnpublishedPosts } from "./test-build/unpublished-posts.ts";
import { checkArtifacts } from "./test-build/artifacts.ts";
import { checkSocialImages } from "./test-build/social-images.ts";

const site = loadBuiltSite();

checkHomeMetadata(site);
checkAboutMetadata(site);
checkPostPages(site);
checkPostCanaries(site);
checkRedirects(site);
checkSecurityHeaders(site);
checkSitemapEntries();
checkSearchIndex(site);
checkUnpublishedPosts(site);
checkArtifacts(site);
checkSocialImages();

console.log("test:build passed");
