export type ThemeReader = (token: string) => string;
export type MermaidThemeVariables = Record<string, string | boolean>;

export type MermaidTheme = {
  fontFamily: string;
  variables: MermaidThemeVariables;
};

/**
 * Map site tokens to Mermaid `theme: "base"` variables. Solid color tokens
 * only: Mermaid does not resolve `color-mix()` or alpha tokens such as
 * `--color-rule`.
 */
export function buildThemeVariables(readVar: ThemeReader): MermaidThemeVariables {
  return {
    // The base theme ships a light gray drop shadow that reads as a glow on
    // dark backgrounds. Node fill and border already carry the elevation.
    dropShadow: "none",
    nodeShadow: false,
    background: readVar("--color-bg"),
    mainBkg: readVar("--color-surface-strong"),
    primaryColor: readVar("--color-surface-strong"),
    primaryTextColor: readVar("--color-text"),
    primaryBorderColor: readVar("--color-text-muted"),
    secondaryColor: readVar("--color-surface"),
    secondaryTextColor: readVar("--color-text"),
    secondaryBorderColor: readVar("--color-text-muted"),
    tertiaryColor: readVar("--color-surface"),
    tertiaryTextColor: readVar("--color-text"),
    tertiaryBorderColor: readVar("--color-text-muted"),
    nodeBorder: readVar("--color-text-muted"),
    lineColor: readVar("--color-text-muted"),
    textColor: readVar("--color-text"),
    titleColor: readVar("--color-text"),
    clusterBkg: readVar("--color-surface"),
    clusterBorder: readVar("--color-border"),
    edgeLabelBackground: readVar("--color-bg"),
    labelBackground: readVar("--color-bg")
  };
}
