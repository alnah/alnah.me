import type { HastNode } from "satteri";

export type HastElement = Extract<HastNode, { type: "element" }>;

/** Class list of a hast element, whether stored as an array or a string. */
export function classList(node: HastElement): string[] {
  const value: unknown = node.properties?.className;

  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "string") {
    return value.split(/\s+/).filter(Boolean);
  }

  return [];
}
