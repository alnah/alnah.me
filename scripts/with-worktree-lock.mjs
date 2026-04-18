import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const lockWaitMs = 100;
const lockTimeoutMs = 5 * 60 * 1000;
const staleLockMs = 15 * 60 * 1000;

function worktreeLockPath(cwd) {
  const digest = createHash("sha256").update(cwd).digest("hex").slice(0, 12);
  return path.join(os.tmpdir(), `alnah-me-worktree-${digest}.lock`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeLockIfStale(lockPath) {
  try {
    const stats = await fs.stat(lockPath);
    if (Date.now() - stats.mtimeMs < staleLockMs) {
      return false;
    }
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }

  await fs.rm(lockPath, { recursive: true, force: true });
  return true;
}

async function acquireLock(lockPath) {
  const deadline = Date.now() + lockTimeoutMs;

  while (true) {
    try {
      await fs.mkdir(lockPath);
      await fs.writeFile(
        path.join(lockPath, "owner.json"),
        JSON.stringify(
          {
            pid: process.pid,
            cwd: process.cwd(),
            command: process.argv.slice(2),
            createdAt: new Date().toISOString()
          },
          null,
          2
        ),
        "utf8"
      );
      return;
    } catch (error) {
      if (!(error && typeof error === "object" && error.code === "EEXIST")) {
        throw error;
      }

      await removeLockIfStale(lockPath);

      if (Date.now() >= deadline) {
        throw new Error(`Timed out waiting for worktree lock: ${lockPath}`);
      }

      await wait(lockWaitMs);
    }
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Command exited from signal: ${signal}`));
        return;
      }

      resolve(code ?? 0);
    });
  });
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/with-worktree-lock.mjs <command> [args...]");
  process.exit(1);
}

const lockPath = worktreeLockPath(process.cwd());

await acquireLock(lockPath);

let exitCode = 1;

try {
  exitCode = await runCommand(command, args);
} finally {
  await fs.rm(lockPath, { recursive: true, force: true });
}

process.exitCode = exitCode;
