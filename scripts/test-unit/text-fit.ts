import assert from "node:assert/strict";
import { truncateText } from "../../src/lib/text-fit.ts";

export function testTextFit() {
  assert.equal(truncateText("short", 10), "short");
  assert.equal(truncateText("  short  ", 10), "short");
  assert.equal(truncateText("a b c d", 5), "a b…");
  assert.equal(truncateText("hello world", 8), "hello…");
  assert.equal(truncateText("abcdefghij", 5), "abcd…");
  assert.equal(truncateText("abc", 0), "");
  assert.equal(truncateText("   ", 5), "");
  assert.equal(truncateText("abc", 3), "abc");
  assert.equal(truncateText("a b", 1), "…");

  for (const maxLength of [1, 2, 5, 8, 12]) {
    assert.ok(
      truncateText("un texte beaucoup trop long pour le budget", maxLength).length <= maxLength,
      `truncateText should respect maxLength ${maxLength}`
    );
  }
}
