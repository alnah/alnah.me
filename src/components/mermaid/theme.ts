export type ThemeReader = (token: string) => string;

/**
 * Subset of Mermaid `theme: "base"` variables the site sets. Keys are closed
 * so a typo fails the type check instead of silently falling back to Mermaid's
 * default.
 */
export type MermaidThemeVariables = {
  dropShadow: string;
  nodeShadow: boolean;
  background: string;
  mainBkg: string;
  primaryColor: string;
  primaryTextColor: string;
  primaryBorderColor: string;
  secondaryColor: string;
  secondaryTextColor: string;
  secondaryBorderColor: string;
  tertiaryColor: string;
  tertiaryTextColor: string;
  tertiaryBorderColor: string;
  nodeBorder: string;
  lineColor: string;
  textColor: string;
  titleColor: string;
  clusterBkg: string;
  clusterBorder: string;
  edgeLabelBackground: string;
  labelBackground: string;
};

/**
 * Bind a token reader to one element so callers can read several CSS custom
 * properties without repeating `getComputedStyle`.
 */
export function createTokenReader(root: HTMLElement): ThemeReader {
  const style = getComputedStyle(root);

  return (token) => style.getPropertyValue(token).trim();
}

/** Convert a `#rgb` or `#rrggbb` token to `rgba()` so the filter stays portable. */
function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());

  if (!match) {
    return color;
  }

  const hex =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : match[1];
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

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
    // The base theme ships a light gray blurred shadow that reads as a glow on
    // dark backgrounds. Replace it with a short, vertical, blur-free shadow
    // under the nodes: light comes from above, so the shadow sits below.
    dropShadow: `drop-shadow(0 2px 0 ${withAlpha(readVar("--color-shade"), 0.2)})`,
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
