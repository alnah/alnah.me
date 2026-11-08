import { defineConfig, passthroughImageService } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import { mermaid } from "./src/lib/markdown/mermaid";

export default defineConfig({
  site: "https://alnah.me",
  output: "static",
  integrations: [sitemap()],
  image: {
    service: passthroughImageService()
  },
  markdown: {
    processor: satteri({ hastPlugins: [mermaid()] }),
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
