import { defineConfig, passthroughImageService } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import { markdownHastPlugins } from "./src/lib/markdown/plugins.ts";

export default defineConfig({
  site: "https://alnah.me",
  output: "static",
  integrations: [sitemap()],
  image: {
    service: passthroughImageService()
  },
  markdown: {
    processor: satteri({ hastPlugins: markdownHastPlugins() }),
    syntaxHighlight: {
      type: "shiki",
      excludeLangs: ["math", "mermaid"]
    },
    shikiConfig: {
      theme: "github-dark-default",
      themes: {
        light: "github-light-default",
        dark: "github-dark-default"
      },
      wrap: true
    }
  }
});
