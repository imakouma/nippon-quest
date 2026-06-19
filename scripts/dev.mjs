import { spawn, execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { chdir } from "node:process";
import { fileURLToPath } from "node:url";

// npm --prefix 以外から起動されても nippon-quest を cwd にする
chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    socket.setTimeout(500);
    socket.on("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

function run(command, args) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
  return child;
}

const children = [];

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** 前回の next dev が残っていると HMR が壊れて画面が反応しなくなるため、起動前に掃除する */
function cleanupStaleNextDev() {
  const lockPath = path.resolve(".next/dev/lock");
  if (existsSync(lockPath)) {
    try {
      const info = JSON.parse(readFileSync(lockPath, "utf-8"));
      if (info.pid && isProcessRunning(info.pid)) {
        console.log(`既存の Next.js dev (PID ${info.pid}) を停止します…`);
        try {
          process.kill(info.pid, "SIGTERM");
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore malformed lock
    }
  }

  for (const port of [3000, 3001]) {
    try {
      const pids = execSync(`lsof -ti :${port}`, { encoding: "utf-8" }).trim();
      if (!pids) continue;
      for (const pid of pids.split("\n")) {
        const n = Number(pid);
        if (n > 0 && n !== process.pid) {
          console.log(`ポート ${port} を使用中のプロセス (PID ${n}) を停止します…`);
          try {
            process.kill(n, "SIGTERM");
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // port is free
    }
  }
}

async function main() {
  cleanupStaleNextDev();
  children.push(run("npx", ["next", "dev"]));

  const convexPort = Number(process.env.CONVEX_PORT ?? 3212);
  const convexRunning = await isPortOpen(convexPort);

  if (convexRunning) {
    console.log(`Convex は既に起動中です (http://127.0.0.1:${convexPort})`);
  } else {
    children.push(run("npx", ["convex", "dev"]));
  }

  const shutdown = (signal) => {
    for (const child of children) {
      child.kill(signal);
    }
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
