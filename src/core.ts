import { promises as fs } from "node:fs";
import path from "node:path";
import { Worker } from "node:worker_threads";
import type { Entry, MatchResult, Scan } from "./types";

// Call containment checks with canonical paths. Preserve component case because
// Windows can enable case-sensitive directories; only drive letters are folded.
export function inside(
  root: string,
  target: string,
  platform = process.platform,
): boolean {
  if (platform === "win32") {
    const key = (value: string) =>
      path.win32
        .normalize(value)
        .replace(/\\/g, "/")
        .replace(/^([a-z]):/i, (_m, drive: string) => drive.toUpperCase() + ":")
        .replace(/\/$/, "");
    const base = key(root),
      candidate = key(target);
    return candidate === base || candidate.startsWith(base + "/");
  }
  const relative = path.posix.relative(root, target);
  return (
    relative === "" ||
    (!relative.startsWith("../") &&
      relative !== ".." &&
      !path.posix.isAbsolute(relative))
  );
}
export function localWindowsPath(value: string): boolean {
  return /^[a-z]:[\\/]/i.test(value);
}
export async function sameFile(
  first: string,
  second: string,
): Promise<boolean> {
  if (first === second) return true;
  try {
    const [a, b] = await Promise.all([
      fs.stat(first, { bigint: true }),
      fs.stat(second, { bigint: true }),
    ]);
    return a.ino !== 0n && a.dev === b.dev && a.ino === b.ino;
  } catch {
    return false;
  }
}
export function windowsRuleError(text: string): string | undefined {
  const lines = text.replace(/^\uFEFF/, "").split("\n");
  const index = lines.findIndex(
    (line) => !line.startsWith("#") && line.includes("\\"),
  );
  return index < 0
    ? undefined
    : `Line ${index + 1}: Backslash rules are not yet supported for Windows local contexts. Use forward-slash rules; Docker Desktop Linux-container parity for backslash escaping is not established.`;
}
export async function scan(
  root: string,
  limit: number,
  signal: AbortSignal,
  progress: (count: number) => void,
): Promise<Scan> {
  root = await fs.realpath(root);
  const entries: Entry[] = [];
  const issues: string[] = [];
  const queue = [""];
  let partial = false;
  outer: while (queue.length) {
    if (signal.aborted) {
      partial = true;
      break;
    }
    const dir = queue.pop()!;
    try {
      const directoryPath = path.join(root, dir);
      if (!inside(root, await fs.realpath(directoryPath)))
        throw new Error("Directory resolves outside the context");
      if ((await fs.lstat(directoryPath)).isSymbolicLink())
        throw new Error(
          "Directory changed into a symbolic link; refresh to rescan",
        );
      const handle = await fs.opendir(directoryPath);
      for await (const child of handle) {
        if (signal.aborted || entries.length >= limit) {
          partial = true;
          break outer;
        }
        const relative = dir ? `${dir}/${child.name}` : child.name;
        try {
          const stat = await fs.lstat(path.join(root, relative));
          const kind = stat.isSymbolicLink()
            ? "symlink"
            : stat.isDirectory()
              ? "directory"
              : stat.isFile()
                ? "file"
                : "unknown";
          entries.push({
            path: relative,
            kind,
            size: kind === "file" ? stat.size : kind === "directory" ? 0 : null,
          });
          if (kind === "directory") queue.push(relative);
          if (kind === "unknown") {
            partial = true;
            issues.push(`${relative}: unsupported file type`);
          }
        } catch (error) {
          entries.push({
            path: relative,
            kind: "unknown",
            size: null,
            error: String(error),
          });
          partial = true;
          issues.push(`${relative}: metadata unavailable`);
        }
        if (entries.length % 250 === 0) progress(entries.length);
      }
    } catch (error) {
      partial = true;
      issues.push(`${dir || "."}: ${String(error)}`);
      const entry = entries.find((e) => e.path === dir);
      if (entry) {
        entry.error = "Directory could not be fully read";
        entry.size = null;
      }
    }
  }
  if (signal.aborted)
    issues.push("Scan cancelled. Only discovered entries are shown.");
  else if (entries.length >= limit)
    issues.push(
      `Scan limit reached (${limit} entries). Increase the limit and refresh.`,
    );
  entries.sort((a, b) => a.path.localeCompare(b.path, "en"));
  return { entries, partial, issues };
}
export async function activeIgnore(
  root: string,
  dockerfile: string,
): Promise<{ file: string | null; specific: boolean; text: string }> {
  for (const [file, specific] of [
    [`${dockerfile}.dockerignore`, true],
    [path.join(root, ".dockerignore"), false],
  ] as const) {
    try {
      const text = await fs.readFile(file, "utf8");
      return { file: await fs.realpath(file), specific, text };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return { file: null, specific: false, text: "" };
}
export class Engine {
  private worker: Worker;
  private next = 0;
  private pending = new Map<
    number,
    { resolve: (r: MatchResult) => void; reject: (e: Error) => void }
  >();
  private ready: Promise<void>;
  constructor(filename: string) {
    this.worker = new Worker(filename);
    this.ready = new Promise((resolve, reject) => {
      this.worker.on("message", (data) => {
        if (data.ready) {
          resolve();
          return;
        }
        const call = this.pending.get(data.id);
        if (call) {
          this.pending.delete(data.id);
          call.resolve(data.result);
        }
      });
      this.worker.on("error", (error) => {
        reject(error);
        this.fail(error);
      });
      this.worker.on("exit", () => {
        const error = new Error("Matching worker stopped");
        reject(error);
        this.fail(error);
      });
    });
  }
  private fail(error: Error) {
    for (const call of this.pending.values()) call.reject(error);
    this.pending.clear();
  }
  async evaluate(
    text: string,
    paths: string[],
    explain = "",
  ): Promise<MatchResult> {
    if (process.platform === "win32") {
      const error = windowsRuleError(text);
      if (error) return { excluded: [], reasons: [], error };
    }
    await this.ready;
    return new Promise((resolve, reject) => {
      const id = ++this.next;
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, request: { text, paths, explain } });
    });
  }
  dispose() {
    this.fail(new Error("Cancelled"));
    void this.worker.terminate();
  }
}
export function totals(entries: Entry[], excluded: boolean[]) {
  let bytes = 0;
  let count = 0;
  let unknown = 0;
  entries.forEach((entry, i) => {
    if (entry.kind === "directory" || excluded[i]) return;
    if (entry.kind === "file" && entry.size !== null) {
      bytes += entry.size;
      count++;
    } else unknown++;
  });
  return { bytes, count, unknown };
}
