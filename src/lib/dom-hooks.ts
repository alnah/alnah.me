/**
 * Class hooks shared by stylesheets, Markdown plugins, and client scripts.
 * A rename happens here, and the style-hook check makes a stale stylesheet
 * loud instead of silently dropping the visual contract.
 */

export const EXTERNAL_LINK_CLASS = "external-link";
export const EXTERNAL_ICON_CLASS = "external-link-icon";
export const FOOTNOTE_REF_CLASS = "footnote-ref";
export const FOOTNOTE_BACKREF_CLASS = "footnote-backref";
export const FOOTNOTE_ICON_CLASS = "footnote-backref-icon";
export const FOOTNOTE_LABEL_ID = "footnote-label";
export const MERMAID_SOURCE_CLASS = "mermaid";
export const MERMAID_DIALOG_CLASS = "mermaid-dialog";
/** Marker class: no style, it only blocks duplicate icons in a diagram. */
export const MERMAID_EXTERNAL_ICON_CLASS = "mermaid-external-icon";

/** Every class hook that must be styled somewhere, or declared unstyled. */
export const CLASS_HOOKS = [
  EXTERNAL_LINK_CLASS,
  EXTERNAL_ICON_CLASS,
  FOOTNOTE_REF_CLASS,
  FOOTNOTE_BACKREF_CLASS,
  FOOTNOTE_ICON_CLASS,
  MERMAID_SOURCE_CLASS,
  MERMAID_DIALOG_CLASS,
  MERMAID_EXTERNAL_ICON_CLASS
] as const;

/** Hooks that carry no style: behavior markers only. */
export const UNSTYLED_HOOKS: readonly string[] = [
  EXTERNAL_LINK_CLASS,
  MERMAID_EXTERNAL_ICON_CLASS
];
