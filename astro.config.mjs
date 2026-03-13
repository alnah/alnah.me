import { defineConfig, passthroughImageService } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://alnah.io",
  output: "static",
  integrations: [sitemap()],
  image: {
    service: passthroughImageService()
  },
  markdown: {
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
