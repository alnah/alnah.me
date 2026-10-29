import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const lockWaitMs = 100;
const lockTimeoutMs = 5 * 60 * 1000;
const staleLockMs = 15 * 60 * 1000;

type LockOwner = {
  pid: number;
  cwd?: string;
  command?: string[];
  createdAt?: string;
};

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}

function worktreeLockPath(cwd: string) {
  const digest = createHash("sha256").update(cwd).digest("hex").slice(0, 12);
  return path.join(os.tmpdir(), `alnah-me-worktree-${digest}.lock`);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function readLockOwner(lockPath: string): Promise<LockOwner | null> {
  try {
    const raw = await fs.readFile(path.join(lockPath, "owner.json"), "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed?.pid === "number" ? parsed : null;
  } catch {
    return null;
  }
}

function isProcessAlive(pid: number) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but is owned by another user.
    return isErrnoException(error) && error.code === "EPERM";
  }
}

async function removeLockIfStale(lockPath: string) {
  let stats;

  try {
    stats = await fs.stat(lockPath);
  } catch (error) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }

  // Hard upper bound: never keep a lock older than the stale window.
  if (Date.now() - stats.mtimeMs >= staleLockMs) {
    await fs.rm(lockPath, { recursive: true, force: true });
    return true;
  }

  const owner = await readLockOwner(lockPath);

  // A lock whose owner is gone can be reclaimed immediately.
  if (owner && !isProcessAlive(owner.pid)) {
    await fs.rm(lockPath, { recursive: true, force: true });
    return true;
  }

  return false;
}

async function acquireLock(lockPath: string) {
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
      if (!(isErrnoException(error) && error.code === "EEXIST")) {
        throw error;
      }

      await removeLockIfStale(lockPath);

      if (Date.now() >= deadline) {
        const owner = await readLockOwner(lockPath);
        const ownerInfo = owner
          ? ` held by pid ${owner.pid} (${(owner.command ?? []).join(" ")})`
          : "";
        throw new Error(`Timed out waiting for worktree lock${ownerInfo}: ${lockPath}`);
      }

      await wait(lockWaitMs);
    }
  }
}

function runCommand(command: string, args: string[]) {
  return new Promise<number>((resolve, reject) => {
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
  console.error("Usage: node scripts/with-worktree-lock.ts <command> [args...]");
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
