import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import "./check-css.ts";
import "./test-build.ts";

// Node 24 needs explicit files: directory arguments are not expanded.
const testFiles = ["scripts/test-unit", "scripts/test-domain"].flatMap((directory) =>
  fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(".test.ts"))
    .map((name) => path.join(directory, name))
);
const unit = spawnSync(process.execPath, ["--test", ...testFiles], {
  stdio: "inherit"
});

if (unit.status !== 0) {
  process.exit(unit.status ?? 1);
}

console.log("verify: all checks passed");
