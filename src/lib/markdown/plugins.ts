import type { HastPluginDefinition } from "satteri";
import { externalLinks } from "./external-links";
import { mermaid } from "./mermaid";

/**
 * Hast plugins shared by the Astro Markdown pipeline and ad hoc renders such
 * as the About page fragments, so both behave the same.
 */
export function markdownHastPlugins(): HastPluginDefinition[] {
  return [mermaid(), externalLinks()];
}
